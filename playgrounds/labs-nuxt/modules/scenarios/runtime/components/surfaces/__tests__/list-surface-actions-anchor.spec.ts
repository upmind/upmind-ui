// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the actions column is ANCHORED to the row's right edge, and
 * the controls in it are the icons D5 made them (D11 · D5).
 *
 * ## Job To Be Done
 * The operator's table had the controls floating after the last data column with
 * dead space to their right, because an actions column that takes an equal share
 * of the table lands wherever the data happens to end. The ruling pins it: the
 * actions cell is the LAST cell of every row — header, data and skeleton alike —
 * and it shrinks to its contents instead of claiming a share, which is what puts
 * it against the edge. Counted and positioned, never measured: jsdom has no
 * widths, so what is asserted is the cell's INDEX and the shrink treatment the ui
 * table is given, not a pixel.
 *
 * ## What Breaks If These Fail
 * The controls drift back into the middle of the row, or a state (loading) draws
 * its placeholder in a different column from the one the real controls land in —
 * the layout jump C8 exists to stop.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface } from "../index";
import { ACTIONS_COLUMN, TABLE_COLUMNS } from "./table-geometry";
import { every, filter, last, map } from "lodash-es";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;

const rows = [defaultRow, unverifiedRow];

const table: ControlledTableChannel = {
  read: () => ({
    filter: {},
    sort: [],
    pagination: { page: 1, perPage: 10, total: rows.length }
  }),
  emit: vi.fn()
};

function mountList(isLoading = false) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: ["remove", "setDefault", "verify"],
        context: { data: isLoading ? [] : rows },
        meta: { isEmpty: isLoading, isFiltered: false, isLoading }
      },
      actions: { remove: vi.fn(), setDefault: vi.fn(), verify: vi.fn() },
      presentation,
      table,
      handoffs: RESOLVED_HANDOFFS
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

const CONTROL = "[data-test-value]";

/** Which cell of its row a control sits in, per row. */
const controlColumns = (wrapper: Wrapper) =>
  map(wrapper.findAll("tbody tr"), row =>
    filter(
      map(row.findAll("td"), (cell, index) =>
        cell.find(CONTROL).exists() ? index : -1
      ),
      index => index >= 0
    )
  );

// -----------------------------------------------------------------------------

describe("@AC3 the actions column is the LAST column (D11)", () => {
  it("adds exactly one column to the declared set, and adds it at the end", () => {
    const wrapper = mountList();
    const headers = wrapper.findAll("thead th");

    expect(headers).toHaveLength(TABLE_COLUMNS);
    // The anchor column carries no header of its own — there is nothing to call
    // a column of controls, and a word there would only be another column.
    expect(last(headers)!.text()).toBe("");
  });

  it("puts every row's controls in that last cell and nowhere else", () => {
    const wrapper = mountList();
    const columns = controlColumns(wrapper);

    expect(columns).toHaveLength(rows.length);
    expect(every(columns, column => column.length > 0)).toBe(true);
    for (const column of columns) expect(column).toEqual([ACTIONS_COLUMN]);
  });

  it("shrinks the anchor cell to its contents, so it ends at the row's edge", () => {
    const wrapper = mountList();
    const header = last(wrapper.findAll("thead th"))!;
    const cell = last(wrapper.findAll("tbody tr")[0].findAll("td"))!;

    expect(header.classes()).toContain("w-px");
    expect(cell.classes()).toContain("w-px");
  });

  it("anchors the LOADING placeholder in the same column the controls land in", () => {
    const wrapper = mountList(true);
    const cells = wrapper.findAll("tbody tr")[0].findAll("td");

    expect(cells).toHaveLength(TABLE_COLUMNS);
    expect(last(cells)!.classes()).toContain("w-px");
  });
});

describe("@AC3 the controls in the anchored column are icons (D5)", () => {
  it("shows no words beside a row — the labels are the accessible name only", () => {
    const wrapper = mountList();
    const control = wrapper
      .findAll("tbody tr")[1]
      .find(`[data-test-value="${CONTROL_TEST_VALUE.remove}"]`);

    expect(control.find("span.sr-only").exists()).toBe(true);
    expect(control.attributes("aria-label")).toBeTruthy();
  });

  it("leaves the COLLECTION's own control its words — it is not beside a row", () => {
    const wrapper = mountList();
    const add = wrapper.find(`[data-test-value="${CONTROL_TEST_VALUE.add}"]`);

    expect(add.exists()).toBe(true);
    expect(add.find("span.sr-only").exists()).toBe(false);
  });
});
