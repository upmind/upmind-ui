// -----------------------------------------------------------------------------
/**
 * @module tests/custom-pages
 * @description Plan Phase 6 / gap doc X15: a brand's own extra pages are
 * DATA, so the pages a brand publishes decide which slugs resolve, which of
 * them join the primary nav, and what each one renders — markdown for a page
 * the brand wrote, an embedded frame for one it borrowed. A path naming
 * nothing says so and offers the way back, where this shape used to
 * replace-navigate to the dashboard in silence.
 *
 * Graded against the gates-off dataset (plan R9), which publishes none: an
 * injection proven only on the brand that happens to seed a page is a seed
 * read-back, not an injection.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { stringsIn } from "./support/page-config";
import { assign, concat, filter, find, map, reject, size } from "lodash-es";
import type { MockCustomPage, MockDataset } from "~/portal/mock/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { withDatasetCustomAreas } from "~/portal/mock/custom-pages";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import {
  customPageFrames,
  customPageHasBody,
  customPageHasFrames,
  customPageMarkdown,
  customPagePath,
  pillarNavItems
} from "~/portal/mock/selectors";
import { resolveCatchAll } from "~/portal/routes";
import {
  PAGE_KEY,
  PORTAL_PILLAR,
  RESERVED_PILLAR_SEGMENT
} from "~/portal/types";

vi.mock("~/composables/usePortalConfig", async () => {
  const { computed: reactiveComputed } = await import("vue");
  const { hostgridConfig: config } = await import("~/portal/config/hostgrid");
  const { withDatasetCustomAreas: withAreas } =
    await import("~/portal/mock/custom-pages");
  const { HOSTGRID_MOCK_DATASET: data } =
    await import("~/portal/mock/hostgrid");
  const { MOCK_DATASET_ID: ids } = await import("~/portal/mock/store");
  return {
    usePortalConfig: () => ({
      activeConfig: reactiveComputed(() => withAreas(config, data)),
      activeDatasetId: reactiveComputed(() => ids.HOSTGRID)
    })
  };
});

/** The slug a brand would have to publish to shadow a pillar the portal owns. */
const HOSTILE_SLUGS: readonly string[] = concat(
  Object.values(RESERVED_PILLAR_SEGMENT),
  map(hostgridConfig.groups ?? [], "slug")
);

const HOME = mockActionValue(MOCK_ACTION.NAVIGATE, "/");

function areaSlugs(data: MockDataset | undefined): string[] {
  return map(withDatasetCustomAreas(hostgridConfig, data).customAreas, "slug");
}

function pageBy(
  data: MockDataset,
  trait: string,
  matches: (page: MockCustomPage) => boolean
): MockCustomPage {
  const page = find(data.customPages, matches);
  if (page === undefined) throw new Error(`seed publishes no ${trait}`);
  return page;
}

function contextFor(page: MockCustomPage) {
  return { entityId: page.slug };
}

/** A brand publishing a page at each slug the portal reserves for itself. */
function withHostilePages(): MockDataset {
  const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(data, {
    customPages: map(HOSTILE_SLUGS, slug => ({
      slug,
      title: `Squatter ${slug}`,
      body: "Not the portal's own page.",
      showOnMenu: false
    }))
  });
}

async function mountCatchAllAt(slug: readonly string[]) {
  const navigateTo = vi.fn();
  const useRoute = () => ({ params: { slug }, path: `/${slug.join("/")}` });
  Object.assign(globalThis, {
    navigateTo,
    useRoute,
    // Nuxt's compile-time macro; the page calls it at setup.
    definePageMeta: () => undefined
  });

  const page = await import("~/pages/[...slug].vue");
  const host = defineComponent({
    render: () => h(Suspense, null, { default: () => h(page.default) })
  });
  const wrapper = mount(host);
  await flushPromises();

  return { wrapper, navigateTo };
}

describe("a brand's pages become the shape's own custom areas", () => {
  it("folds every published page in, in the order the brand published them", () => {
    expect(hostgridConfig.customAreas).toEqual([]);
    expect(areaSlugs(HOSTGRID_MOCK_DATASET)).toEqual(
      map(HOSTGRID_MOCK_DATASET.customPages, "slug")
    );
    expect(size(HOSTGRID_MOCK_DATASET.customPages)).toBe(2);
  });

  it("leaves the shape untouched for a brand that publishes none", () => {
    expect(areaSlugs(HOSTGRID_MINIMAL_MOCK_DATASET)).toEqual(
      map(hostgridConfig.customAreas, "slug")
    );
    expect(HOSTGRID_MINIMAL_MOCK_DATASET.customPages).toEqual([]);
  });
});

describe("the primary nav — legacy injected show_on_menu pages after the products tab", () => {
  it("seats the menu page directly after Products & Services, and leaves the other out", () => {
    const onMenu = pageBy(HOSTGRID_MOCK_DATASET, "menu page", {
      showOnMenu: true
    });
    const offMenu = pageBy(
      HOSTGRID_MOCK_DATASET,
      "off-menu page",
      page => page.showOnMenu !== true
    );
    const items = pillarNavItems(HOSTGRID_MOCK_DATASET);

    expect(items[1]?.to).toBe(`/${PORTAL_PILLAR.PRODUCTS}`);
    expect(items[2]?.label).toBe(onMenu.title);
    expect(items[2]?.to).toBe(customPagePath(onMenu.slug));
    expect(map(items, "to")).not.toContain(customPagePath(offMenu.slug));
  });

  it("injects nothing into a brand with no pages to inject", () => {
    const onMenu = pageBy(HOSTGRID_MOCK_DATASET, "menu page", {
      showOnMenu: true
    });
    const unpublished: MockDataset = assign(
      structuredClone(HOSTGRID_MOCK_DATASET),
      { customPages: [] }
    );

    // Same dataset, same gates, pages withdrawn: only the injection moves.
    expect(map(pillarNavItems(unpublished), "label")).toEqual(
      reject(
        map(pillarNavItems(HOSTGRID_MOCK_DATASET), "label"),
        label => label === onMenu.title
      )
    );
    expect(
      map(pillarNavItems(HOSTGRID_MINIMAL_MOCK_DATASET), "to")
    ).not.toContain(customPagePath(onMenu.slug));
  });
});

describe("each published page resolves at its own slug and renders what it carries", () => {
  const config = withDatasetCustomAreas(hostgridConfig, HOSTGRID_MOCK_DATASET);

  it("resolves every one of them as a custom area", () => {
    for (const page of HOSTGRID_MOCK_DATASET.customPages) {
      const resolution = resolveCatchAll(config, [page.slug]);

      expect(resolution.kind).toBe("custom-area");
      expect(
        resolution.kind === "custom-area" ? resolution.area.label : undefined
      ).toBe(page.title);
    }
  });

  it("renders the authored page as markdown and never as a frame", () => {
    const authored = pageBy(
      HOSTGRID_MOCK_DATASET,
      "page with its own body",
      page => page.body !== undefined
    );
    const context = contextFor(authored);

    expect(customPageHasBody(HOSTGRID_MOCK_DATASET, context)).toBe(true);
    expect(customPageMarkdown(HOSTGRID_MOCK_DATASET, context)).toBe(
      authored.body
    );
    expect(customPageHasFrames(HOSTGRID_MOCK_DATASET, context)).toBe(false);
    expect(customPageFrames(HOSTGRID_MOCK_DATASET, context)).toEqual([]);
  });

  it("renders the borrowed page as a frame at its own URL and never as markdown", () => {
    const embedded = pageBy(
      HOSTGRID_MOCK_DATASET,
      "page embedding another",
      page => page.iframeUrl !== undefined
    );
    const context = contextFor(embedded);

    expect(customPageHasFrames(HOSTGRID_MOCK_DATASET, context)).toBe(true);
    expect(
      map(customPageFrames(HOSTGRID_MOCK_DATASET, context), "url")
    ).toEqual([embedded.iframeUrl]);
    expect(customPageHasBody(HOSTGRID_MOCK_DATASET, context)).toBe(false);
    expect(customPageMarkdown(HOSTGRID_MOCK_DATASET, context)).toBe("");
  });
});

describe("a path that names nothing", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "navigateTo");
    Reflect.deleteProperty(globalThis, "useRoute");
    Reflect.deleteProperty(globalThis, "definePageMeta");
  });

  it("resolves to nothing the config declares", () => {
    const config = withDatasetCustomAreas(
      hostgridConfig,
      HOSTGRID_MOCK_DATASET
    );

    expect(resolveCatchAll(config, ["no-such-page-4c7d"]).kind).toBe(
      "unmatched"
    );
  });

  it("offers the way home, and the way home is the only thing it does", () => {
    const page = hostgridConfig.pages?.[PAGE_KEY.NOT_FOUND];
    if (page === undefined) throw new Error("no not-found page config");

    expect(stringsIn(page)).toContain(HOME);
    expect(dispatchMockAction(HOSTGRID_MOCK_DATASET, {}, HOME)).toEqual({
      to: "/"
    });
  });

  it("says so on the page instead of navigating away from it", async () => {
    const { wrapper, navigateTo } = await mountCatchAllAt([
      "no-such-page-4c7d"
    ]);

    expect(navigateTo).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Page not found");
    expect(wrapper.text()).toContain("Go back");
  });

  it("still renders a published page rather than the not-found state", async () => {
    const authored = pageBy(
      HOSTGRID_MOCK_DATASET,
      "page with its own body",
      page => page.body !== undefined
    );
    const { wrapper, navigateTo } = await mountCatchAllAt([authored.slug]);

    expect(navigateTo).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Page not found");
  });
});

describe("the segments the portal reserves for itself", () => {
  it("keeps a product group's own slug, whatever the brand publishes there", () => {
    const config = withDatasetCustomAreas(hostgridConfig, withHostilePages());

    for (const slug of map(hostgridConfig.groups ?? [], "slug")) {
      expect(resolveCatchAll(config, [slug]).kind, slug).toBe("group-listing");
    }
    expect(size(hostgridConfig.groups ?? [])).toBeGreaterThan(0);
  });

  it("never hands a reserved pillar segment to a brand's page", () => {
    const config = withDatasetCustomAreas(hostgridConfig, withHostilePages());

    for (const slug of Object.values(RESERVED_PILLAR_SEGMENT)) {
      expect(resolveCatchAll(config, [slug]).kind, slug).not.toBe(
        "custom-area"
      );
    }
  });

  it("the shipped brand publishes nothing at a reserved segment", () => {
    expect(
      filter(HOSTGRID_MOCK_DATASET.customPages, page =>
        HOSTILE_SLUGS.includes(page.slug)
      )
    ).toEqual([]);
  });
});
