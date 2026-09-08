import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { ListModuleItem } from "~/portal/modules/list/types";
import ListModule from "~/portal/modules/list/List.vue";

/**
 * bdd.md B7 — "one data array, four arrangements" / AC6.2. The SAME source
 * array renders as `compact`, `table`, `masonry` and `timeline`; each must
 * show every item, and the containers must differ from one another — never
 * the same container with a variant prop merely echoed back.
 */
const ITEMS: readonly ListModuleItem[] = [
  { id: "row-1", title: "First Item", description: "First description" },
  { id: "row-2", title: "Second Item", description: "Second description" },
  { id: "row-3", title: "Third Item", description: "Third description" }
];

describe("List — AC6.2: compact/table/masonry/timeline render one array four ways", () => {
  it("compact renders every item in a list container, not a table or timeline", () => {
    const wrapper = mount(ListModule, {
      props: { variant: "compact", items: ITEMS, emptyTitle: "No items" }
    });
    expect(wrapper.findAll('[data-test-key="portal-list-item"]')).toHaveLength(
      ITEMS.length
    );
    expect(wrapper.find('[data-slot="list"]').exists()).toBe(true);
    expect(wrapper.find('[data-slot="table-container"]').exists()).toBe(false);
    expect(wrapper.find('[data-slot="timeline"]').exists()).toBe(false);
    // Never a masonry column split.
    expect(wrapper.find('[data-slot="list"]').classes().join(" ")).not.toMatch(
      /columns-/
    );
  });

  it("table renders one table row per item", () => {
    const wrapper = mount(ListModule, {
      props: { variant: "table", items: ITEMS, emptyTitle: "No items" }
    });
    expect(wrapper.find('[data-slot="table-container"]').exists()).toBe(true);
    const rows = wrapper.findAll('[data-slot="table-row"]');
    expect(rows).toHaveLength(ITEMS.length);
    rows.forEach((row, index) => {
      expect(row.text()).toContain(ITEMS[index]?.title);
    });
  });

  it("masonry renders every item in a multi-column container, distinct from compact's single column", () => {
    const wrapper = mount(ListModule, {
      props: { variant: "masonry", items: ITEMS, emptyTitle: "No items" }
    });
    expect(wrapper.findAll('[data-test-key="portal-list-item"]')).toHaveLength(
      ITEMS.length
    );
    const container = wrapper.find('[data-slot="list"]');
    expect(container.exists()).toBe(true);
    // A column count "above one" (AC6.2) — symbolic proxy per
    // rules/verify-reality-check.md (jsdom cannot compute layout): the
    // masonry-only multi-column utility classes, absent from compact.
    const classes = container.classes();
    expect(classes.some(cls => /^columns-/.test(cls))).toBe(true);
    expect(classes.some(cls => /columns-(2|3)$/.test(cls))).toBe(true);
  });

  it("timeline renders every item as a timeline entry, not a list or table", () => {
    const wrapper = mount(ListModule, {
      props: { variant: "timeline", items: ITEMS, emptyTitle: "No items" }
    });
    expect(wrapper.find('[data-slot="timeline"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-slot="timeline-item"]')).toHaveLength(
      ITEMS.length
    );
    expect(wrapper.find('[data-slot="list"]').exists()).toBe(false);
    expect(wrapper.find('[data-slot="table-container"]').exists()).toBe(false);
  });

  it("a different array is what renders — the rows are never fixed", () => {
    const wrapper = mount(ListModule, {
      props: { variant: "compact", items: ITEMS, emptyTitle: "No items" }
    });
    expect(wrapper.text()).toContain("First Item");

    const swapped: readonly ListModuleItem[] = [
      { id: "new-1", title: "Replacement Item One" },
      { id: "new-2", title: "Replacement Item Two" }
    ];
    wrapper.setProps({ items: swapped });
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.text()).not.toContain("First Item");
      expect(wrapper.text()).toContain("Replacement Item One");
      expect(wrapper.text()).toContain("Replacement Item Two");
      expect(
        wrapper.findAll('[data-test-key="portal-list-item"]')
      ).toHaveLength(swapped.length);
    });
  });
});
