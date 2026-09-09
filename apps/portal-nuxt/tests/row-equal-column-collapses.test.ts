import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PortalRow from "~/portal/content/PortalRow.vue";

/**
 * bdd.md B6 — "each row layout resolves to its columns": "a row of two
 * row-1-1 slots measures them equal to one another" and "at 390px all six
 * resolve to a single column". Paired blind with
 * tests/row-equal-column-collapses.must-fail.patch.
 */
describe("PortalRow — B6: row-1-1 resolves to two equal columns at lg+, one below it", () => {
  it("carries a two-equal-column grid at lg+, with no unprefixed multi-column override", () => {
    const wrapper = mount(PortalRow, {
      props: { layout: "row-1-1" },
      slots: { start: "<div>START</div>", end: "<div>END</div>" }
    });

    const classes = wrapper.classes();
    // At lg+: two equal tracks.
    expect(classes).toContain("lg:grid-cols-2");
    // Below lg: no base-level multi-column override, so it collapses to one.
    expect(classes).not.toContain("grid-cols-2");

    expect(wrapper.text()).toContain("START");
    expect(wrapper.text()).toContain("END");
  });

  it("is distinct from the three-column and asymmetric layouts, which never collapse to the row-1-1 shape", () => {
    const triple = mount(PortalRow, {
      props: { layout: "row-1-1-1" },
      slots: {
        start: "<div>START</div>",
        middle: "<div>MIDDLE</div>",
        end: "<div>END</div>"
      }
    });
    expect(triple.classes()).toContain("lg:grid-cols-3");
    expect(triple.classes()).not.toContain("lg:grid-cols-2");
  });
});
