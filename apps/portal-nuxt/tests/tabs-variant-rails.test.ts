import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { TabsModuleTab } from "~/portal/modules/tabs/types";
import TabsModule from "~/portal/modules/tabs/Tabs.vue";

/**
 * bdd.md B7 — "tabs carry the board's variants" / AC6.3: `pills`,
 * `underlined` (the module's own `underline` spelling — design.md §D4's
 * labels-are-semantic caveat) and `segmented` must each be visually
 * distinct, and `pills` with a vertical orientation must stack its
 * triggers. jsdom cannot compute layout, so the vertical-stack read-back
 * uses the symbolic mechanism that drives it (`data-orientation`/
 * `aria-orientation` on the tablist), per rules/verify-reality-check.md.
 */
const TABS: readonly TabsModuleTab[] = [
  { value: "a", label: "Tab A", content: "Panel A" },
  { value: "b", label: "Tab B", content: "Panel B" }
];

function railClass(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('[role="tablist"]').classes().join(" ");
}

describe("Tabs — AC6.3: pills, underline and segmented are each visually distinct rails", () => {
  it("renders three pairwise-different rail class sets for the same tab data", () => {
    const pills = mount(TabsModule, {
      props: { tabs: TABS, variant: "pills", emptyTitle: "No tabs" }
    });
    const underline = mount(TabsModule, {
      props: { tabs: TABS, variant: "underline", emptyTitle: "No tabs" }
    });
    const segmented = mount(TabsModule, {
      props: { tabs: TABS, variant: "segmented", emptyTitle: "No tabs" }
    });

    const classSets = [
      railClass(pills),
      railClass(underline),
      railClass(segmented)
    ];
    expect(new Set(classSets).size).toBe(3);

    for (const wrapper of [pills, underline, segmented]) {
      expect(wrapper.text()).toContain("Tab A");
      expect(wrapper.text()).toContain("Tab B");
    }
  });

  it("stacks pills' triggers on a vertical orientation, distinct from the horizontal default", () => {
    const horizontalPills = mount(TabsModule, {
      props: { tabs: TABS, variant: "pills", emptyTitle: "No tabs" }
    });
    const verticalPills = mount(TabsModule, {
      props: {
        tabs: TABS,
        variant: "pills",
        orientation: "vertical",
        emptyTitle: "No tabs"
      }
    });

    expect(
      horizontalPills.find('[role="tablist"]').attributes("data-orientation")
    ).toBe("horizontal");
    expect(
      verticalPills.find('[role="tablist"]').attributes("data-orientation")
    ).toBe("vertical");
    expect(
      verticalPills.find('[role="tablist"]').attributes("aria-orientation")
    ).toBe("vertical");
  });
});
