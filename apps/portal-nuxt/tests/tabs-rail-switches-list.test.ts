import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { computed } from "vue";
import { hostgridConfig } from "~/portal/config/hostgrid";
import PortalContent from "~/portal/content/PortalContent.vue";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  ACTIVE_MOCK_DATA,
  ACTIVE_ROUTE_CONTEXT
} from "~/portal/mock/injection";
import TabsModule from "~/portal/modules/tabs/Tabs.vue";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

/**
 * The `tabs` module's two roles (legacy's status tabs, plan §1.2). Tabs
 * carrying `content` render their own panels, as the boards' tab blocks do.
 * Tabs carrying an `action` are a RAIL over content that lives BELOW them in
 * the row: picking one emits its action and the module changes nothing
 * itself, so the route stays the single source of which tab is showing.
 *
 * Paired blind with tests/tabs-rail-switches-list.must-fail.patch.
 */
const RAIL_TABS = [
  { value: "all", label: "All", action: "navigate:/products?status=all" },
  {
    value: "active",
    label: "Active",
    action: "navigate:/products?status=active"
  },
  {
    value: "cancelled",
    label: "Cancelled",
    action: "navigate:/products?status=cancelled"
  }
];

function mountRail(selected: string) {
  return mount(TabsModule, {
    props: { tabs: RAIL_TABS, selected, emptyTitle: "No filters" }
  });
}

describe("tabs — a rail switches the list below it, a tab block owns its panel", () => {
  // Nuxt's auto-imported `useRoute` has no runtime here (the suite's own
  // convention — see tests/action-pane-drawer-duplicate.test.ts).
  beforeEach(() => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/products" }) });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("shows the selected tab from its prop, so a reload keeps the tab", () => {
    const wrapper = mountRail("cancelled");
    const selected = wrapper
      .findAll('[role="tab"]')
      .filter(tab => tab.attributes("aria-selected") === "true");

    expect(selected).toHaveLength(1);
    expect(selected[0]?.text()).toBe("Cancelled");
  });

  it("emits the picked tab's action and never moves itself", async () => {
    const wrapper = mountRail("active");
    const cancelled = wrapper
      .findAll('[role="tab"]')
      .find(tab => tab.text() === "Cancelled");

    // reka's trigger activates on mousedown, which is what a real click sends
    // first — proven in a browser; jsdom's `click` never reaches it.
    await cancelled?.trigger("mousedown");

    expect(wrapper.emitted("select")).toEqual([
      ["navigate:/products?status=cancelled"]
    ]);
    // Still showing Active — the route answers, not the module.
    const selected = wrapper
      .findAll('[role="tab"]')
      .filter(tab => tab.attributes("aria-selected") === "true");
    expect(selected[0]?.text()).toBe("Active");
  });

  it("a rail's panels carry the collapse rule, so no empty panel sits under it", () => {
    const wrapper = mountRail("active");
    const panels = wrapper.findAll('[role="tabpanel"]');

    expect(panels.length).toBeGreaterThan(0);
    expect(
      panels.every(panel => panel.classes().includes("empty:hidden"))
    ).toBe(true);
    expect(panels.every(panel => panel.text() === "")).toBe(true);
  });

  /**
   * The regression this pins: a FULL row renders `slots[0]` and NOTHING else
   * (`ROW_SLOT_NAMES`), so authoring the rail and its list as two slots
   * silently dropped the list — the page showed tabs over nothing, while the
   * pager kept reporting counts because it reads the collection from the
   * row's footer. The two ride one slot as a group.
   */
  it("the group listing renders the rail AND the rows it switches", () => {
    const rows = resolve(hostgridConfig, {
      pageKeys: [PAGE_KEY.GROUP_LISTING]
    }).content.rows;

    const wrapper = mount(PortalContent, {
      props: { rows },
      global: {
        provide: {
          [ACTIVE_MOCK_DATA as symbol]: computed(() => HOSTGRID_MOCK_DATASET),
          [ACTIVE_ROUTE_CONTEXT as symbol]: computed(() => ({
            groupSlug: "products"
          }))
        }
      }
    });

    expect(wrapper.findAll('[role="tab"]').length).toBe(3);
    const rendered = wrapper.findAll('[data-test-key="portal-list-item"]');
    expect(rendered.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain("Team Plan");
  });

  it("a content-carrying tab still renders its own panel — the boards' tab blocks", () => {
    const wrapper = mount(TabsModule, {
      props: {
        tabs: [
          { value: "one", label: "One", content: "The first panel." },
          { value: "two", label: "Two", content: "The second panel." }
        ],
        selected: "one",
        emptyTitle: "No tabs"
      }
    });

    expect(wrapper.text()).toContain("The first panel.");
    // No action means nothing to emit — a tab block is not a rail.
    expect(wrapper.emitted("select")).toBeUndefined();
  });
});
