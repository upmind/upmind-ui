// -----------------------------------------------------------------------------
/**
 * @fileoverview The catalogue loads `domain` only for a category that shows the domain search.
 *
 * ## Job To Be Done
 * A grid category never evaluates the domain package; a DAC category evaluates it
 * once and draws its widget.
 *
 * ## What Breaks If These Fail
 * Every catalogue page ships and runs the domain tree, or a DAC category draws
 * no domain search.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { PRODUCT_LIST_STYLE } from "@upmind-automation/headless";
import Catalogue from "../components/Catalogue.vue";
import { CATALOGUE_TEMPLATE } from "../types";
import type { CatalogueTemplates } from "../types";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";

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

const domainLoad = vi.hoisted(() => ({ evaluations: 0 }));

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

vi.mock("@upmind-automation/domain", async () => {
  const vue = await import("vue");
  domainLoad.evaluations += 1;
  return {
    UpmDacWidget: vue.defineComponent({
      setup: () => () => vue.h("div", { "data-test-key": "domain-dac-widget" })
    })
  };
});

// -----------------------------------------------------------------------------

const BRAND_WANTS_GRID = {
  "@context.catalogue.productList": PRODUCT_LIST_STYLE.GRID
};

const GRID_CATEGORY: StubCategory = {
  id: CATEGORY_ID,
  name: "zzz-category",
  title: "Zzz category"
};

const DAC_CATEGORY: StubCategory = {
  id: CATEGORY_ID,
  name: "zzz-category",
  title: "Zzz category",
  uiMeta: { widgets: { dac: true } }
};

function stub(key: string): Component {
  return defineComponent({
    setup: () => () => h("div", { "data-test-key": key })
  });
}

const STUBS = {
  Categories: stub("categories"),
  Breadcrumbs: stub("breadcrumbs"),
  CategoriesFacet: stub("categories-facet"),
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

let mounted: VueWrapper | undefined;

async function browse(category: StubCategory) {
  categories.value = { [CATEGORY_ID]: category };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "catalogue", component: stub("page") },
      { path: "/:pathMatch(.*)*", name: "rest", component: stub("page") }
    ]
  });
  await router.push({ path: "/", query: { catid: CATEGORY_ID } });
  await router.isReady();
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    messages: { en: {} }
  });

  mounted = mount(
    defineComponent({
      setup: () => () =>
        h(
          Catalogue,
          { categoryRoute: { name: "catalogue" } },
          {
            default: ({ template }: { template: CATALOGUE_TEMPLATE }) =>
              h(CATALOGUE_TEMPLATES[template])
          }
        )
    }),
    { global: { plugins: [router, i18n], stubs: STUBS } }
  );
  await vi.dynamicImportSettled();
  await flushPromises();
  return mounted;
}

beforeEach(() => {
  brandMeta.value = BRAND_WANTS_GRID;
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

// -----------------------------------------------------------------------------

// Ordered: the module registry keeps the first evaluation, so the grid runs first.
describe("the domain package behind the catalogue", () => {
  it("is never evaluated for a grid category", async () => {
    const wrapper = await browse(GRID_CATEGORY);

    expect(wrapper.find('[data-test-key="widget-grid"]').exists()).toBe(true);
    expect(domainLoad.evaluations).toBe(0);
  });

  it("is evaluated once for a DAC category, which draws its widget", async () => {
    const wrapper = await browse(DAC_CATEGORY);

    expect(domainLoad.evaluations).toBe(1);
    expect(wrapper.find('[data-test-key="domain-dac-widget"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-test-key="widget-grid"]').exists()).toBe(false);
  });
});
