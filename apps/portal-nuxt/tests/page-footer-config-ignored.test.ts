import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * bdd.md B6 — "the page footer is a config decision": "a footer element is
 * present, below the last row" and "with the footer removed from the
 * config, no footer element is present." Mirrors
 * content-measure-ignored.test.ts's mock-the-config approach — the page file
 * itself never changes between the two renders. Paired blind with
 * tests/page-footer-config-ignored.must-fail.patch.
 */
describe("index page — B6: the content config's footer flag drives PageFooter", () => {
  afterEach(() => {
    vi.doUnmock("~/portal/config/hostgrid");
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("renders PageFooter only when the content config declares one, with the page file unchanged", async () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });

    vi.resetModules();
    vi.doMock("~/portal/config/hostgrid", () => ({
      hostgridTheme: { name: "hostgrid" },
      hostgridConfig: {
        primitives: {},
        content: { footer: true },
        groups: [],
        customAreas: []
      }
    }));
    const { default: WithFooter } = await import("~/pages/index.vue");
    const withFooter = mount(WithFooter);
    const footerPresent = withFooter.findAll("[data-slot=page-footer]");
    withFooter.unmount();

    vi.resetModules();
    vi.doMock("~/portal/config/hostgrid", () => ({
      hostgridTheme: { name: "hostgrid" },
      hostgridConfig: {
        primitives: {},
        content: {},
        groups: [],
        customAreas: []
      }
    }));
    const { default: WithoutFooter } = await import("~/pages/index.vue");
    const withoutFooter = mount(WithoutFooter);
    const footerAbsent = withoutFooter.findAll("[data-slot=page-footer]");
    withoutFooter.unmount();

    expect(footerPresent).toHaveLength(1);
    expect(footerAbsent).toHaveLength(0);
  });
});
