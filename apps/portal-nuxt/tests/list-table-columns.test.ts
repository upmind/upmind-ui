// -----------------------------------------------------------------------------
/**
 * @module tests/list-table-columns
 * @description The `table` variant renders a REAL table through `@upmind/ui`'s
 * own `Table` — a header row the config names, one cell per column, right-
 * aligned figures, and the row's action beside it. Before this it was a
 * header-less grid of three cells that dropped `action` on the floor, which is
 * why the billing panels could not use it.
 *
 * Paired blind with tests/list-table-columns.must-fail.patch.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed } from "vue";
import { map } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { ListModuleItem } from "~/portal/modules/list/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import PortalContent from "~/portal/content/PortalContent.vue";
import {
  ACTIVE_MOCK_DATA,
  ACTIVE_ROUTE_CONTEXT
} from "~/portal/mock/injection";
import { MOCK_DATASET_ID, useMockData } from "~/portal/mock/store";
import ListModule from "~/portal/modules/list/List.vue";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

const HEAD = "th";
const CELL = "td";
const ROW = '[data-test-key="portal-list-item"]';

const HEADINGS = [
  { label: "Document" },
  { label: "Issued" },
  { label: "Total", numeric: true },
  { label: "" }
];

const ITEMS: readonly ListModuleItem[] = [
  {
    id: "row-1",
    title: "INV-0001",
    cells: [{ value: "2026-08-01" }, { value: "$10.00", numeric: true }],
    action: { value: "pay-invoice:row-1", label: "Pay" }
  },
  {
    id: "row-2",
    title: "INV-0002",
    cells: [{ value: "2026-07-01" }, { value: "$20.00", numeric: true }]
  }
];

function mountTable(props: Record<string, unknown> = {}) {
  return mount(ListModule, {
    props: {
      variant: "table",
      items: ITEMS,
      emptyTitle: "No documents",
      headings: HEADINGS,
      ...props
    }
  });
}

describe("list table variant — headings, cells and the row action", () => {
  it("renders the config's header row, in order, with the figures right-aligned", () => {
    const wrapper = mountTable();
    const heads = wrapper.findAll(HEAD);

    expect(map(heads, head => head.text())).toEqual([
      "Document",
      "Issued",
      "Total",
      ""
    ]);
    // ui's TableHead owns the numeric treatment; the module only declares it.
    expect(heads[2]?.attributes("class")).toContain("text-right");
    expect(heads[1]?.attributes("class")).not.toContain("text-right");
  });

  it("renders one cell per declared column, the amount among them", () => {
    const cells = mountTable().findAll(ROW).at(0)?.findAll(CELL) ?? [];

    // Title, the two cells, then the action column.
    expect(cells).toHaveLength(4);
    expect(cells[0]?.text()).toBe("INV-0001");
    expect(cells[1]?.text()).toBe("2026-08-01");
    expect(cells[2]?.text()).toBe("$10.00");
    expect(cells[2]?.attributes("class")).toContain("text-right");
  });

  it("carries the row's action, and emits its value — the drop that blocked the billing panels", async () => {
    const wrapper = mountTable();

    const button = wrapper.findAll(ROW).at(0)?.find("button");
    expect(button?.exists()).toBe(true);
    expect(button?.text()).toBe("Pay");

    await button?.trigger("click");
    expect(wrapper.emitted("select")).toEqual([["pay-invoice:row-1"]]);

    // The row without one keeps the column, so the grid stays square.
    const second = wrapper.findAll(ROW).at(1);
    expect(second?.findAll(CELL)).toHaveLength(4);
    expect(second?.find("button").exists()).toBe(false);
  });

  it("falls back to the description as one cell, and renders no header when none is named", () => {
    const wrapper = mount(ListModule, {
      props: {
        variant: "table",
        items: [{ id: "row-1", title: "First", description: "Only column" }],
        emptyTitle: "No documents"
      }
    });

    expect(wrapper.findAll(HEAD)).toHaveLength(0);
    const cells = wrapper.find(ROW).findAll(CELL);
    expect(map(cells, cell => cell.text())).toEqual(["First", "Only column"]);
  });
});

describe("the billing panels are tables, not stacked rows", () => {
  function mountPage(pageKey: (typeof PAGE_KEY)[keyof typeof PAGE_KEY]) {
    const context: DataRouteContext = {};
    return mount(PortalContent, {
      props: {
        rows: resolve(hostgridConfig, { pageKeys: [pageKey] }).content.rows,
        asideLabel: "Page aside"
      },
      global: {
        provide: {
          [ACTIVE_MOCK_DATA as symbol]: computed(() =>
            useMockData(MOCK_DATASET_ID.HOSTGRID)
          ),
          [ACTIVE_ROUTE_CONTEXT as symbol]: computed(() => context)
        }
      }
    });
  }

  it("invoices head their columns and keep Pay on the unpaid rows", () => {
    const wrapper = mountPage(PAGE_KEY.BILLING_INVOICES);

    expect(map(wrapper.findAll(HEAD), head => head.text())).toEqual([
      "Invoice",
      "Issued",
      "Due",
      "Total",
      "Status",
      ""
    ]);
    // The badge names the state now that the amount has a column of its own.
    expect(wrapper.text()).toContain("Unpaid");
    expect(
      wrapper.findAll(`${ROW} button`).some(button => button.text() === "Pay")
    ).toBe(true);
  });
});
