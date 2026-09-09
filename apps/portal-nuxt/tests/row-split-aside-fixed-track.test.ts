import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PortalRow from "~/portal/content/PortalRow.vue";

/**
 * design.md §D7 — `row-2-1`/`row-1-2` are a PROPORTIONAL split (two fluid
 * parts to one), never a sidebar-style fixed track: "the board's `row-2-1`
 * is a proportion: two parts to one, both fluid." bdd.md B6 — "Two Column
 * Left puts the wide slot first and Two Column Right puts it second" — this
 * asserts the PROPORTION only (a pixel pins one viewport; the board specifies
 * a ratio). Paired blind with tests/row-split-aside-fixed-track.must-fail.patch.
 */
describe("PortalRow — D7: row-2-1/row-1-2 hold a two-to-one proportional split, not a fixed track", () => {
  it("gives the wide slot two of the row's three columns, in a fluid three-column grid", () => {
    const wrapper = mount(PortalRow, {
      props: { layout: "row-2-1" },
      slots: {
        main: '<div data-mark="main">MAIN</div>',
        aside: '<div data-mark="aside">ASIDE</div>'
      }
    });

    const rootClasses = wrapper.classes();
    // A proportional grid, not a fixed-track two-column layout.
    expect(rootClasses).toContain("lg:grid-cols-3");
    expect(rootClasses).not.toContain("grid-cols-3");

    const main = wrapper.get('[data-mark="main"]').element.parentElement;
    const aside = wrapper.get('[data-mark="aside"]').element.parentElement;

    expect(main?.classList.contains("lg:col-span-2")).toBe(true);
    expect(aside?.classList.contains("lg:col-span-2")).toBe(false);
  });

  it("keeps the same two-to-one ratio with the wide slot second, only the order flipped", () => {
    const wrapper = mount(PortalRow, {
      props: { layout: "row-1-2" },
      slots: {
        main: '<div data-mark="main">MAIN</div>',
        aside: '<div data-mark="aside">ASIDE</div>'
      }
    });

    const rootClasses = wrapper.classes();
    expect(rootClasses).toContain("lg:grid-cols-3");
    expect(rootClasses).not.toContain("grid-cols-3");

    const main = wrapper.get('[data-mark="main"]').element.parentElement;
    const aside = wrapper.get('[data-mark="aside"]').element.parentElement;

    expect(main?.classList.contains("lg:col-span-2")).toBe(true);
    expect(aside?.classList.contains("lg:col-span-2")).toBe(false);
  });
});
