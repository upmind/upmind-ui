import { mount } from "@vue/test-utils";
import { LayoutDashboard } from "lucide-vue-next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Banner from "~/portal/modules/banner/Banner.vue";
import Breadcrumbs from "~/portal/modules/breadcrumbs/Breadcrumbs.vue";
import ButtonModule from "~/portal/modules/button/Button.vue";
import EmptyStateModule from "~/portal/modules/empty-state/EmptyStateModule.vue";
import ListModule from "~/portal/modules/list/List.vue";
import Menu from "~/portal/modules/menu/Menu.vue";
import Metric from "~/portal/modules/metric/Metric.vue";
import SearchModule from "~/portal/modules/search/Search.vue";
import StatusBlock from "~/portal/modules/status-block/StatusBlock.vue";
import TabsModule from "~/portal/modules/tabs/Tabs.vue";

/**
 * tasks.md Task 5's AC6.1 — "Menu, Tabs, Breadcrumbs, Search, Banner/Notice,
 * Status Block, Empty State, Button, List, Metric and Module Group are each
 * registered and each renders from its declared data." Module Group's own
 * declared-data rendering is proven by tests/module-group-declared-order-axis.test.ts
 * (its "data" is its member list, checked there against order and axis
 * rather than plain text). Each module below is mounted directly, off data
 * that names nothing the module itself could hardcode by coincidence, and
 * the read-back is the rendered text/attribute, never the prop echoed back.
 */
describe("module set — AC6.1: every module renders from the data it is given", () => {
  beforeEach(() => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("Menu renders its configured items, as links to their configured paths", () => {
    const items = [
      { to: "/alpha-route", label: "Alpha Route", icon: LayoutDashboard },
      { to: "/beta-route", label: "Beta Route", icon: LayoutDashboard }
    ];
    const wrapper = mount(Menu, { props: { items } });
    const links = wrapper.findAll("nuxtlink, a");
    expect(links.map(link => link.text())).toEqual(
      expect.arrayContaining(["Alpha Route", "Beta Route"])
    );
    expect(wrapper.html()).toContain('to="/alpha-route"');
  });

  it("Tabs renders its configured tabs and the active tab's own content", () => {
    const wrapper = mount(TabsModule, {
      props: {
        tabs: [
          { value: "a", label: "Overview Tab", content: "First panel body" },
          { value: "b", label: "Usage Tab", content: "Second panel body" }
        ],
        emptyTitle: "No tabs"
      }
    });
    expect(wrapper.text()).toContain("Overview Tab");
    expect(wrapper.text()).toContain("Usage Tab");
    expect(wrapper.text()).toContain("First panel body");
  });

  it("Breadcrumbs renders its configured trail, in order", () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        items: [{ label: "Crumb One" }, { label: "Crumb Two", current: true }],
        moreLabel: "More"
      }
    });
    const crumbs = wrapper.findAll('[data-test-key="breadcrumb-item"]');
    expect(crumbs.map(crumb => crumb.text())).toEqual([
      "Crumb One",
      "Crumb Two"
    ]);
  });

  it("Search renders its configured items once queried", async () => {
    const wrapper = mount(SearchModule, {
      props: {
        items: [{ id: "1", label: "Configured Search Result" }],
        emptyTitle: "Nothing to search",
        minQueryLength: 0
      },
      attachTo: document.body
    });
    await wrapper.find("input").setValue("Configured");
    expect(document.body.textContent).toContain("Configured Search Result");
    wrapper.unmount();
  });

  it("Banner (variant=banner) renders its configured message and label", () => {
    const wrapper = mount(Banner, {
      props: {
        variant: "banner",
        message: "Configured banner message",
        label: "Configured region label",
        dismissLabel: "Dismiss"
      }
    });
    expect(wrapper.text()).toContain("Configured banner message");
    expect(wrapper.attributes("aria-label")).toBe("Configured region label");
  });

  it("Banner (variant=notice) renders its configured title and message", () => {
    const wrapper = mount(Banner, {
      props: {
        variant: "notice",
        title: "Configured notice title",
        message: "Configured notice message",
        label: "Notice",
        dismissLabel: "Dismiss"
      }
    });
    expect(wrapper.text()).toContain("Configured notice title");
    expect(wrapper.text()).toContain("Configured notice message");
  });

  it("StatusBlock renders its configured label", () => {
    const wrapper = mount(StatusBlock, {
      props: { label: "Configured status", tone: "warning" }
    });
    expect(wrapper.text()).toContain("Configured status");
  });

  it("EmptyState renders its configured title and description", () => {
    const wrapper = mount(EmptyStateModule, {
      props: {
        title: "Configured empty title",
        description: "Configured empty description"
      }
    });
    expect(wrapper.text()).toContain("Configured empty title");
    expect(wrapper.text()).toContain("Configured empty description");
  });

  it("Button renders each of the board's four forms from its configured data", () => {
    const single = mount(ButtonModule, {
      props: { variant: "single", label: "Single Label" }
    });
    expect(single.text()).toContain("Single Label");

    const group = mount(ButtonModule, {
      props: {
        variant: "group",
        label: "ignored",
        actions: [
          { value: "a", label: "Group Action One" },
          { value: "b", label: "Group Action Two" }
        ]
      }
    });
    const groupButtons = group.findAll('[data-test-key="button"]');
    expect(groupButtons.map(button => button.text())).toEqual([
      "Group Action One",
      "Group Action Two"
    ]);

    const dropdown = mount(ButtonModule, {
      props: {
        variant: "dropdown",
        label: "Dropdown Label",
        actions: [{ value: "a", label: "Dropdown Action" }]
      }
    });
    expect(dropdown.text()).toContain("Dropdown Label");

    const split = mount(ButtonModule, {
      props: {
        variant: "split",
        label: "Split Label",
        moreLabel: "More split actions",
        actions: [{ value: "a", label: "Split Action" }]
      }
    });
    expect(split.text()).toContain("Split Label");
    const secondaryTrigger = split.findAll('[data-test-key="button"]').at(1);
    expect(secondaryTrigger?.attributes("aria-label")).toBe(
      "More split actions"
    );
  });

  it("List renders its configured items", () => {
    const wrapper = mount(ListModule, {
      props: {
        variant: "compact",
        items: [{ id: "x", title: "Configured List Item" }],
        emptyTitle: "No items"
      }
    });
    expect(wrapper.text()).toContain("Configured List Item");
  });

  it("Metric renders its configured items", () => {
    const wrapper = mount(Metric, {
      props: {
        items: [{ label: "Configured Metric", value: "42" }],
        emptyTitle: "No metrics"
      }
    });
    expect(wrapper.text()).toContain("Configured Metric");
    expect(wrapper.text()).toContain("42");
  });
});
