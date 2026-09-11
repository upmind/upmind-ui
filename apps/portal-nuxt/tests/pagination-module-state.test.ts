// -----------------------------------------------------------------------------
/**
 * @module tests/pagination-module-state
 * @description The pagination module's two forms (plan §2 pager wiring). Fed
 * a live `state` it is CONTROLLED: it self-hides at one page, renders the
 * facade's page, and its arrows emit their action values through the one
 * `select` seam — it never moves itself. With flat props only it stays the
 * DECORATIVE form Rockzone ships: rendered, uncontrolled, silent.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PaginationModule from "~/portal/modules/pagination/Pagination.vue";

const PAGER = '[data-test-key="portal-pagination"]';
const NEXT = '[data-test-key="next"]';
const PREV = '[data-test-key="previous"]';

describe("pagination module — controlled by state, decorative without it", () => {
  it("renders the decorative form from flat props, with no select wiring", async () => {
    const wrapper = mount(PaginationModule, {
      props: {
        total: 24,
        itemsPerPage: 3,
        label: "Progress weeks",
        info: "This Week · W20"
      }
    });

    expect(wrapper.find(PAGER).exists()).toBe(true);
    expect(wrapper.text()).toContain("This Week · W20");

    await wrapper.find(NEXT).trigger("click");
    expect(wrapper.emitted("select")).toBeUndefined();
  });

  it("self-hides while the collection fits one page", () => {
    const wrapper = mount(PaginationModule, {
      props: {
        state: { total: 5, itemsPerPage: 10, page: 1 },
        label: "Email history pages"
      }
    });

    expect(wrapper.find(PAGER).exists()).toBe(false);
  });

  it("emits the next action value and never moves itself", async () => {
    const wrapper = mount(PaginationModule, {
      props: {
        state: {
          total: 15,
          itemsPerPage: 10,
          page: 1,
          prevValue: "page-prev:x",
          nextValue: "page-next:x"
        },
        label: "Paid pages"
      }
    });

    expect(wrapper.find(PAGER).exists()).toBe(true);
    expect(wrapper.text()).toContain("1 / 2");

    await wrapper.find(NEXT).trigger("click");
    expect(wrapper.emitted("select")).toEqual([["page-next:x"]]);
    // Still page 1 — the facade owns the page; only a new `state` moves it.
    expect(wrapper.text()).toContain("1 / 2");
  });

  it("emits the prev action value from a later page", async () => {
    const wrapper = mount(PaginationModule, {
      props: {
        state: {
          total: 15,
          itemsPerPage: 10,
          page: 2,
          prevValue: "page-prev:x",
          nextValue: "page-next:x"
        },
        label: "Paid pages"
      }
    });

    await wrapper.find(PREV).trigger("click");
    expect(wrapper.emitted("select")).toEqual([["page-prev:x"]]);
  });
});
