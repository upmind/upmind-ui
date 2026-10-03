// -----------------------------------------------------------------------------
/**
 * @fileoverview The browse page's choice between the domain search and the grid.
 *
 * ## Job To Be Done
 * A category that asks for the domain search, or a brand whose product list is
 * the DAC, gets the domain widget; every other category gets the product grid.
 *
 * ## What Breaks If These Fail
 * A domain category lists no domain search, or a product category loses its grid.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { PRODUCT_LIST_STYLE } from "@upmind-automation/headless";
import Catalogue from "../components/Catalogue.vue";
import { CATALOGUE_TEMPLATE } from "../types";
import { assign, filter, map } from "lodash-es";
import type { CatalogueTemplates } from "../types";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

type StubCategory = {
  id: string;
  name: string;
  title: string;
  uiMeta?: Record<string, unknown>;
};

const CATEGORY_ID = "zzz-category";

const brandMeta = ref<Record<string, unknown>>({});
const categories = ref<Record<string, StubCategory>>({});

function categoryAt(id?: string): StubCategory | undefined {
  if (!id) return undefined;
  return categories.value[id];
}

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual =
    await importOriginal<typeof import("@upmind-automation/headless")>();
  const { assign, compact } = await import("lodash-es");
  return assign({}, actual, {
    useBrand: () => ({ uiCart: brandMeta }),
    useProductCategories: () => ({
      getOne: categoryAt,
      getPath: (id?: string) => compact([categoryAt(id)])
    }),
    useConfig: (options?: Parameters<typeof actual.useConfig>[0]) =>
      actual.useConfig(
        assign({}, options, { brand: brandMeta, basket: undefined })
      )
  });
});

// -----------------------------------------------------------------------------

const BRAND_WANTS_DAC = {
  "@context.catalogue.productList": PRODUCT_LIST_STYLE.DAC
};
const BRAND_WANTS_GRID = {
  "@context.catalogue.productList": PRODUCT_LIST_STYLE.GRID
};

const PLAIN_CATEGORY: StubCategory = {
  id: CATEGORY_ID,
  name: "zzz-category",
  title: "Zzz category"
};
const CATEGORY_WANTS_DAC: StubCategory = assign({}, PLAIN_CATEGORY, {
  uiMeta: { widgets: { dac: true } }
});

function stub(key: string): Component {
  return defineComponent({
    setup: () => () => h("div", { "data-test-key": key })
  });
}

const STUBS = {
  Categories: stub("categories"),
  Breadcrumbs: stub("breadcrumbs"),
  CategoriesFacet: stub("categories-facet"),
  WidgetDAC: stub("widget-dac"),
  WidgetGrid: stub("widget-grid")
};

const HostTemplate = defineComponent({
  inheritAttrs: false,
  setup:
    (_props, { slots }) =>
    () =>
      h("div", [
        slots["content-header"]?.(),
        slots.content?.(),
        slots["aside-footer"]?.(),
        slots["content-footer"]?.()
      ])
});

const CATALOGUE_TEMPLATES: CatalogueTemplates = {
  [CATALOGUE_TEMPLATE.FULL]: HostTemplate
};

async function routerOn(query: Record<string, string>): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "catalogue", component: stub("page") },
      { path: "/:pathMatch(.*)*", name: "rest", component: stub("page") }
    ]
  });
  await router.push({ path: "/", query });
  await router.isReady();
  return router;
}

let mounted: VueWrapper | undefined;

async function mountCatalogue(query: Record<string, string> = {}) {
  const router = await routerOn(query);
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    messages: { en: {} }
  });

  const Harness = defineComponent({
    setup: () => () =>
      h(
        Catalogue,
        { categoryRoute: { name: "catalogue" } },
        {
          default: ({ template }: { template: CATALOGUE_TEMPLATE }) =>
            h(CATALOGUE_TEMPLATES[template])
        }
      )
  });

  mounted = mount(Harness, {
    global: { plugins: [router, i18n], stubs: STUBS }
  });
  return mounted;
}

function catalogueWarnings(): unknown[] {
  return filter(
    map(vi.mocked(console.warn).mock.calls, "0"),
    message => typeof message === "string" && message.startsWith("[catalogue] ")
  );
}

beforeEach(() => {
  brandMeta.value = BRAND_WANTS_GRID;
  categories.value = { [CATEGORY_ID]: PLAIN_CATEGORY };
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  vi.restoreAllMocks();
});

// -----------------------------------------------------------------------------

describe("a brand that asks for the DAC through its productList setting", () => {
  beforeEach(() => {
    brandMeta.value = BRAND_WANTS_DAC;
  });

  it("renders the domain widget, and not the grid", async () => {
    const wrapper = await mountCatalogue();

    expect(wrapper.find('[data-test-key="widget-dac"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-key="widget-grid"]').exists()).toBe(false);
  });

  it("draws the widget's two footer anchors", async () => {
    const wrapper = await mountCatalogue();

    expect(wrapper.find("#domain-aside-footer").exists()).toBe(true);
    expect(wrapper.find("#domain-content-footer").exists()).toBe(true);
  });

  it("warns about nothing", async () => {
    await mountCatalogue();

    expect(catalogueWarnings()).toEqual([]);
  });
});

describe("a brand that asks for the DAC through the category's uiMeta", () => {
  beforeEach(() => {
    categories.value = { [CATEGORY_ID]: CATEGORY_WANTS_DAC };
  });

  it("renders the domain widget, and not the grid", async () => {
    const wrapper = await mountCatalogue({ catid: CATEGORY_ID });

    expect(wrapper.find('[data-test-key="widget-dac"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-key="widget-grid"]').exists()).toBe(false);
    expect(catalogueWarnings()).toEqual([]);
  });

  it("leaves a category that does not ask on the grid", async () => {
    categories.value = { [CATEGORY_ID]: PLAIN_CATEGORY };

    const wrapper = await mountCatalogue({ catid: CATEGORY_ID });

    expect(wrapper.find('[data-test-key="widget-grid"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-key="widget-dac"]').exists()).toBe(false);
  });
});

describe("a brand that never asked for the DAC", () => {
  it("renders the grid with no warning", async () => {
    const wrapper = await mountCatalogue({ catid: CATEGORY_ID });

    expect(wrapper.find('[data-test-key="widget-grid"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-key="widget-dac"]').exists()).toBe(false);
    expect(catalogueWarnings()).toEqual([]);
  });

  it("draws neither footer anchor", async () => {
    const wrapper = await mountCatalogue({ catid: CATEGORY_ID });

    expect(wrapper.find("#domain-aside-footer").exists()).toBe(false);
    expect(wrapper.find("#domain-content-footer").exists()).toBe(false);
  });
});
