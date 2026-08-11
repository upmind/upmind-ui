// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the default marker is its OWN column, and it has two states
 * (D14, operator: *"a dedicated first column with NO table header — every row
 * shows the star: FILLED on the default row, EMPTY outline on non-defaults"*).
 *
 * ## Job To Be Done
 * The star used to ride inside the email cell, jammed against the address, which
 * is what made the default row read as a typographic accident rather than a
 * state. D14 gives it a column of its own at the head of every row and no header
 * over it — nothing to call a column of stars — and, crucially, gives it two
 * states: every row carries the SAME glyph, filled on the one default and
 * outlined everywhere else. Two states is what makes the column readable: a
 * column that draws a mark only sometimes reads as sparse data, while a column
 * that always draws one and fills exactly one reads as a choice.
 *
 * ## What Breaks If These Fail
 * The star drifts back into the email cell (D7's alignment defect), or the column
 * collapses to one state — a full star against every address, so the shape of the
 * feature survives with none of its meaning and the operator can no longer tell
 * which address is the default. That collapse is exactly what
 * `list-surface-marker-column.must-fail.patch` performs.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Icon } from "@upmind-automation/upmind-ui";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface } from "../index";
import {
  DECLARED_HEADERS,
  FIRST_DECLARED_COLUMN,
  MARKER_COLUMN
} from "./table-geometry";
import { filter, first, keys, map } from "lodash-es";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const presentation = clientEmails.presentation;
const rows = [defaultRow, unverifiedRow];

/** Row 0 IS the default; row 1 is not — the capture run's own two records. */
const MARKED = 0;
const UNMARKED = 1;

const MARKER = presentation.row?.options?.marker;

const ACTIONS: SurfaceActions = {
  remove: vi.fn(),
  setDefault: vi.fn(),
  verify: vi.fn()
};

function mountList() {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(ACTIONS),
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: ACTIONS,
      presentation,
      handoffs: RESOLVED_HANDOFFS,
      table: {
        read: () => ({
          filter: {},
          sort: [],
          pagination: { page: 1, perPage: 10, total: rows.length }
        }),
        emit: vi.fn()
      }
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

const cellOf = (wrapper: Wrapper, row: number, column: number) =>
  wrapper.findAll("tbody tr")[row].findAll("td")[column];

/**
 * The marker glyph's drawn STATE per row — the icon pack variant, which is what
 * distinguishes a filled star from an outlined one when both are the same glyph.
 * Scoped to one cell on purpose: the row's controls declare the same `star-01`
 * for `set as default`, so a whole-row sweep would count a button as a marker.
 */
const markerStatesIn = (root: {
  findAllComponents: Wrapper["findAllComponents"];
}) =>
  map(
    filter(
      root.findAllComponents(Icon),
      icon => icon.props("icon") === MARKER?.icon
    ),
    icon => icon.props("variant")
  );

// -----------------------------------------------------------------------------

describe("@AC3 the marker column sits FIRST and carries no header (D14)", () => {
  it("puts an unlabelled column ahead of every declared one", () => {
    const wrapper = mountList();
    const headers = wrapper.findAll("thead th");

    expect(headers[MARKER_COLUMN].text()).toBe("");
    expect(headers[FIRST_DECLARED_COLUMN].text()).toBe(first(DECLARED_HEADERS));
  });

  it("gives every row a marker cell in that column, default or not", () => {
    const wrapper = mountList();

    for (const row of [MARKED, UNMARKED]) {
      expect(markerStatesIn(cellOf(wrapper, row, MARKER_COLUMN))).toHaveLength(
        1
      );
    }
  });

  it("leaves the email cell to the address alone — the star moved out of it", () => {
    const wrapper = mountList();

    for (const row of [MARKED, UNMARKED]) {
      expect(
        markerStatesIn(cellOf(wrapper, row, FIRST_DECLARED_COLUMN))
      ).toEqual([]);
    }
    expect(cellOf(wrapper, MARKED, FIRST_DECLARED_COLUMN).text()).toContain(
      defaultRow.email
    );
  });
});

describe("@AC3 the column draws TWO states, not one (D14)", () => {
  it("declares both states off one glyph, so the column is readable either way", () => {
    expect(MARKER?.icon).toBeTruthy();
    expect(MARKER?.marked).toBeTruthy();
    expect(MARKER?.unmarked).toBeTruthy();
    expect(MARKER?.marked).not.toBe(MARKER?.unmarked);
  });

  it("fills the star on the row the module itself flags as default", () => {
    const wrapper = mountList();

    expect(defaultRow.meta.isDefault).toBe(true);
    expect(markerStatesIn(cellOf(wrapper, MARKED, MARKER_COLUMN))).toEqual([
      MARKER?.marked
    ]);
  });

  it("outlines it on every row the module does not", () => {
    const wrapper = mountList();

    expect(unverifiedRow.meta.isDefault).toBe(false);
    expect(markerStatesIn(cellOf(wrapper, UNMARKED, MARKER_COLUMN))).toEqual([
      MARKER?.unmarked
    ]);
  });

  it("never draws the two rows the same — the one default stays distinguishable", () => {
    const wrapper = mountList();

    expect(markerStatesIn(cellOf(wrapper, MARKED, MARKER_COLUMN))).not.toEqual(
      markerStatesIn(cellOf(wrapper, UNMARKED, MARKER_COLUMN))
    );
  });
});
