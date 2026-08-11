// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the skeleton is the DECLARED shape, per view (C8, operator:
 * *"the skeleton MUST match the shape of whatever it is standing in for"*).
 *
 * ## Job To Be Done
 * A placeholder that guesses is the key-sniffing defect one layer down: the
 * operator waits on a shape that is not the shape that arrives. So the skeleton
 * is derived from the same declaration the real content is — one cell per
 * declared column under the real headers in the table, one placeholder per
 * declared card field in cards — and it changes with the view toggle exactly as
 * the content does. Counted, not eyeballed: a column count and a per-row cell
 * count are the honest instruments in jsdom, where nothing has a width.
 *
 * ## What Breaks If These Fail
 * The skeleton collapses to one column-spanning block — the generic placeholder
 * the finding rejected — and the layout jumps when the rows land, which is the
 * whole thing G4 was built to stop.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Card, Skeleton } from "@upmind-automation/upmind-ui";
import clientEmails from "../../../../useClientEmails/scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface, ListViewTypes } from "../index";
import {
  DECLARED_COLUMNS,
  FIRST_DECLARED_COLUMN,
  TABLE_COLUMNS
} from "./table-geometry";
import { map, times, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const presentation = clientEmails.presentation;

function mountLoading() {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: [],
        context: { data: [] },
        meta: { isEmpty: true, isFiltered: false, isLoading: true }
      },
      actions: {},
      presentation,
      handoffs: RESOLVED_HANDOFFS,
      table: {
        read: () => ({
          filter: {},
          sort: [],
          pagination: { page: 1, perPage: 10, total: 0 }
        }),
        emit: vi.fn()
      }
    }
  });
}

// -----------------------------------------------------------------------------

describe("@AC3 the table skeleton stands in for the declared ROW", () => {
  it("gives every skeleton row one cell per column the table actually has", () => {
    const wrapper = mountLoading();
    const rows = wrapper.findAll("tbody tr");

    expect(rows.length).toBeGreaterThan(0);
    expect(uniq(map(rows, row => row.findAll("td").length))).toEqual([
      TABLE_COLUMNS
    ]);
  });

  it("matches the header row it sits under, column for column", () => {
    const wrapper = mountLoading();

    expect(wrapper.findAll("thead th")).toHaveLength(TABLE_COLUMNS);
    expect(wrapper.findAll("tbody tr")[0].findAll("td")).toHaveLength(
      wrapper.findAll("thead th").length
    );
  });

  it("spans no columns — a colspanned block is the generic placeholder, not a row", () => {
    const wrapper = mountLoading();

    for (const cell of wrapper.findAll("tbody td")) {
      expect(cell.attributes("colspan")).toBeUndefined();
    }
  });

  it("draws a placeholder in each declared column's cell", () => {
    const wrapper = mountLoading();
    const row = wrapper.findAll("tbody tr")[0];

    times(DECLARED_COLUMNS, index =>
      expect(
        row
          .findAll("td")
          [FIRST_DECLARED_COLUMN + index].findAllComponents(Skeleton).length
      ).toBeGreaterThan(0)
    );
  });
});

describe("@AC3 the card skeleton stands in for the declared CARD", () => {
  it("gives every placeholder card one placeholder per declared card field", async () => {
    const wrapper = mountLoading();
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    const cards = wrapper.findAllComponents(Card);
    expect(cards.length).toBeGreaterThan(0);
    expect(
      uniq(map(cards, card => card.findAllComponents(Skeleton).length))
    ).toEqual([presentation.card?.elements.length]);
  });

  it("changes with the view toggle, exactly as the real content does", async () => {
    const wrapper = mountLoading();
    const inTable = wrapper.findAllComponents(Skeleton).length;

    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    expect(wrapper.find("table").exists()).toBe(false);
    expect(wrapper.findAllComponents(Skeleton).length).not.toBe(inTable);
  });
});
