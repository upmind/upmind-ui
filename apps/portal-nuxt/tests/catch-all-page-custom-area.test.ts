import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";

/**
 * AC1.5 / design.md §D9 consequence 1 — a configured Custom Area is a real
 * destination the catch-all resolves and renders, not something the
 * replace-navigation fallback swallows. Neither shipped brand configures a
 * Custom Area, so this feeds one through the page's own seam
 * (usePortalConfig) rather than touching production config. Paired blind with
 * tests/catch-all-page-wiring.must-fail.patch, which deletes the page's
 * `if (current.kind === "unmatched")` guard so it replace-navigates on
 * every resolution, including this one.
 */

vi.mock("~/composables/usePortalConfig", async () => {
  const { computed } = await import("vue");
  const { CUSTOM_AREA_TAG } = await import("~/portal/types");
  return {
    usePortalConfig: () => ({
      activeConfig: computed(() => ({
        primitives: {},
        content: {},
        groups: [],
        customAreas: [
          {
            slug: "loyalty",
            label: "Loyalty Programme",
            [CUSTOM_AREA_TAG]: true
          }
        ]
      })),
      // The page reads the DATASET id for its mock lookups — a fixture id, so
      // no dataset resolves and the area's own label heads the page.
      activeDatasetId: computed(() => "fixture-shape")
    })
  };
});

async function mountCatchAllAt(slug: readonly string[]) {
  const navigateTo = vi.fn();
  // The real route always carries a path — PortalPageHost reads it (portal/areas.ts).
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

afterEach(() => {
  Reflect.deleteProperty(globalThis, "navigateTo");
  Reflect.deleteProperty(globalThis, "useRoute");
  Reflect.deleteProperty(globalThis, "definePageMeta");
});

describe("catch-all page — a configured custom area renders and does not fall back", () => {
  it("renders the area's label and never calls navigateTo", async () => {
    const { wrapper, navigateTo } = await mountCatchAllAt(["loyalty"]);

    expect(wrapper.text()).toContain("Loyalty Programme");
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
