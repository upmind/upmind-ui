import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * bdd.md B6 — "the measure is a config value": "the content container's
 * computed max-width differs" between a narrow and a wide content config,
 * with "no page file changed" — proven here by mocking the DEFAULT shape's config module
 * (`~/portal/config/hostgrid`), never by editing the page itself. Paired
 * blind with tests/content-measure-ignored.must-fail.patch.
 */
describe("index page — B6: the content config's measure drives the page's max-width", () => {
  afterEach(() => {
    vi.doUnmock("~/portal/config/hostgrid");
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("renders a narrower container under a reading measure than under a wide one, with the page file unchanged", async () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });

    vi.resetModules();
    vi.doMock("~/portal/config/hostgrid", () => ({
      hostgridTheme: { name: "hostgrid" },
      hostgridConfig: {
        primitives: {},
        content: { measure: "reading" },
        groups: [],
        customAreas: []
      }
    }));
    const { default: NarrowIndex } = await import("~/pages/index.vue");
    const narrow = mount(NarrowIndex);
    const narrowClass = narrow.find('[data-slot="page"]').attributes("class");
    narrow.unmount();

    vi.resetModules();
    vi.doMock("~/portal/config/hostgrid", () => ({
      hostgridTheme: { name: "hostgrid" },
      hostgridConfig: {
        primitives: {},
        content: { measure: "wide" },
        groups: [],
        customAreas: []
      }
    }));
    const { default: WideIndex } = await import("~/pages/index.vue");
    const wide = mount(WideIndex);
    const wideClass = wide.find('[data-slot="page"]').attributes("class");
    wide.unmount();

    expect(narrowClass).toBeDefined();
    expect(wideClass).toBeDefined();
    expect(narrowClass).not.toBe(wideClass);
  });
});
