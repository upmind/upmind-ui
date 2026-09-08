import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";

/**
 * AC1.5 / design.md §D9 consequence 1 — the catch-all resolves a matched
 * product group or product path BEFORE falling back to the replace-
 * navigation. Paired blind with tests/catch-all-page-wiring.must-fail.patch,
 * which deletes the page's `if (current.kind === "unmatched")` guard so it
 * replace-navigates on EVERY resolution — the shipped suite never wrote
 * these cases, because tests/routes.test.ts's mountCatchAll() is only ever
 * called with its UNMATCHED_SLUG default. Feeds a FIXTURE config carrying a
 * "websites" product group through the page's own seam (usePortalConfig):
 * neither shipped brand configures a group since the hosting shape's removal
 * (2026-08-25), and the group machinery stays graded against fixtures until
 * hosting returns. See catch-all-page-custom-area.test.ts for the Custom
 * Area case.
 */

vi.mock("~/composables/usePortalConfig", async () => {
  const { computed } = await import("vue");
  const { defineProductGroup } = await import("~/portal/routes");
  return {
    usePortalConfig: () => ({
      activeConfig: computed(() => ({
        primitives: {},
        content: {},
        groups: [defineProductGroup({ slug: "websites", label: "Websites" })],
        customAreas: []
      })),
      // The page reads the DATASET id for the mock lookup (heading + data
      // refs) — a fixture id, so no dataset resolves and the bare id heads.
      activeConfigId: computed(() => "fixture-shape"),
      activeDatasetId: computed(() => "fixture-shape")
    })
  };
});

async function mountCatchAllAt(slug: readonly string[]) {
  const navigateTo = vi.fn();
  // The real route always carries a path — PortalPageHost reads it (portal/areas.ts).
  const useRoute = () => ({ params: { slug }, path: `/${slug.join("/")}` });
  Object.assign(globalThis, { navigateTo, useRoute });

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
});

describe("catch-all page — a matched product group renders and does not fall back", () => {
  it("renders the group's listing heading and never calls navigateTo", async () => {
    const { wrapper, navigateTo } = await mountCatchAllAt(["websites"]);

    expect(wrapper.text()).toContain("Websites");
    expect(navigateTo).not.toHaveBeenCalled();
  });
});

describe("catch-all page — a matched product path renders and does not fall back", () => {
  it("renders the group/id heading and never calls navigateTo", async () => {
    const { wrapper, navigateTo } = await mountCatchAllAt([
      "websites",
      "pkg-1"
    ]);

    // The detail heading is the product NAME (legacy parity) — the bare id
    // when the active dataset has no such product, as with this fixture id.
    expect(wrapper.text()).toContain("pkg-1");
    expect(wrapper.text()).not.toContain("Websites — pkg-1");
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
