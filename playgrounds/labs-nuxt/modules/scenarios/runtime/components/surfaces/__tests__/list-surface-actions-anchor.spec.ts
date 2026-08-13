// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the actions column is ANCHORED to the row's right edge, the
 * controls in it are the icons D5 made them wherever they are drawn, and they
 * sit in one horizontal cluster (D11 · D5 · E1 · E10).
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
 *
 * ## Retired here
 * "the COLLECTION's own control gets the same treatment (E10)" — `G4` moved
 * Add-new out of this surface to the page header, where `design.md` §4 draws it
 * as a LABELLED primary button. `D5`/`E10` govern the row's icon controls, which
 * are what remains below; the header's control is `page-header.spec.ts`'s.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Card } from "@upmind-automation/upmind-ui";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface, ListViewTypes } from "../index";
import { ACTIONS_COLUMN, TABLE_COLUMNS } from "./table-geometry";
import {
  every,
  filter,
  first,
  last,
  map,
  slice,
  startsWith,
  uniq
} from "lodash-es";
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

/** The nearest element holding both — the cluster they are drawn in. */
function sharedAncestor(one: Element, two: Element): HTMLElement {
  let candidate = one.parentElement;
  while (candidate && !candidate.contains(two))
    candidate = candidate.parentElement;
  return candidate as HTMLElement;
}

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

describe("@AC3 column widths do not move when the data does (E7)", () => {
  it("gives every declared column the same width treatment, so none is measured from its content", () => {
    const wrapper = mountList();
    const declared = slice(wrapper.findAll("thead th"), 1, ACTIONS_COLUMN);

    expect(declared.length).toBeGreaterThan(1);
    expect(
      uniq(map(declared, header => header.classes().join(" ")))
    ).toHaveLength(1);
  });

  it("keeps that treatment through the state swap a sort repaints in", () => {
    const widths = (wrapper: Wrapper) =>
      map(wrapper.findAll("thead th"), header =>
        filter(header.classes(), name => startsWith(name, "w-"))
      );

    expect(widths(mountList(true))).toEqual(widths(mountList()));
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

  it("gives every control in the anchored column that same treatment", () => {
    const wrapper = mountList();
    const cell = last(wrapper.findAll("tbody tr")[1].findAll("td"))!;

    for (const control of cell.findAll(`button${CONTROL}`)) {
      expect(control.find("span.sr-only").exists()).toBe(true);
      expect(control.attributes("aria-label")).toBeTruthy();
    }
  });
});

describe("@AC3 a row's controls are ONE horizontal cluster (E1)", () => {
  it("draws every one of them inside a single container", () => {
    const wrapper = mountList();
    const cell = last(wrapper.findAll("tbody tr")[1].findAll("td"))!;
    const controls = map(cell.findAll(CONTROL), control => control.element);

    expect(controls.length).toBeGreaterThan(1);
    const cluster = sharedAncestor(first(controls)!, last(controls)!);

    expect(every(controls, control => cluster.contains(control))).toBe(true);
  });

  it("lays that container out along the row, never down it", () => {
    const wrapper = mountList();
    const cell = last(wrapper.findAll("tbody tr")[1].findAll("td"))!;
    const controls = map(cell.findAll(CONTROL), control => control.element);
    const cluster = sharedAncestor(first(controls)!, last(controls)!);

    expect(cluster.className).toContain("flex-nowrap");
    expect(cluster.className).not.toContain("flex-col");
  });

  it("clusters the CARD's controls the same way — one row height everywhere", async () => {
    const wrapper = mountList();
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    const card = wrapper.findAllComponents(Card)[1];
    const controls = map(card.findAll(CONTROL), control => control.element);

    expect(controls.length).toBeGreaterThan(1);
    const cluster = sharedAncestor(first(controls)!, last(controls)!);

    expect(cluster.className).toContain("flex-nowrap");
    expect(cluster.className).not.toContain("flex-col");
  });
});
