import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Metric from "~/portal/modules/metric/Metric.vue";

/**
 * ui-gaps.md (F2, `columns:2` mitigation) — a `columns` value declared in a
 * config must actually reach the rendered `StatGroup`, not be silently
 * dropped at the `Metric` -> `StatGroup` pass-through. The pixel spill this
 * mitigates is a Playwright concern; the mechanism is provable in jsdom via
 * the grid's own responsive-column class, which is absent at `columns: 2`
 * (2 columns already holds at every width `>= sm`) and present at the
 * library default. Asserting `stat-group-grid`'s class list both ways is
 * the pair: without the mirror, a resolver that always drops `lg:grid-cols-3`
 * would pass the `columns: 2` half alone.
 */
describe("Metric — a config `columns` value reaches the rendered StatGroup", () => {
  it("columns:2 renders no lg:grid-cols-3, and the library default does", () => {
    const items = [{ label: "A", value: "1" }];

    const narrowed = mount(Metric, {
      props: { items, columns: 2, emptyTitle: "No data" }
    });
    const defaulted = mount(Metric, {
      props: { items, emptyTitle: "No data" }
    });

    const narrowedGrid = narrowed.find('[data-slot="stat-group-grid"]');
    const defaultedGrid = defaulted.find('[data-slot="stat-group-grid"]');

    expect(narrowedGrid.classes()).not.toContain("lg:grid-cols-3");
    expect(defaultedGrid.classes()).toContain("lg:grid-cols-3");
  });
});
