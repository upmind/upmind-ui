// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC2/@AC3 tabular AND card, from the scenario's TWO declarations
 * (C13, operator: *"rendering the table rows in tabular AND card with a toggle
 * is useful"*).
 *
 * ## Job To Be Done
 * A card is not a second component, it is a SECOND uischema over the same row —
 * which is FE-2977's own AC, *"the same schema must render several ways"*. So
 * the toggle chooses between two declarations: the table draws
 * `presentation.row` in its order, the card draws `presentation.card` in its
 * order and its slots, and neither view invents a field. Which view is on is the
 * renderer's own ephemeral state (AC2) — no refetch, no declaration, no url.
 *
 * ## What Breaks If These Fail
 * The card becomes a re-labelled table row and the scenario's second declaration
 * goes unread — the card view exists but declares nothing, so every new scenario
 * pays a renderer edit for its card. Or the toggle refetches, and switching how
 * you look at rows costs a round trip.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Card } from "@upmind-automation/upmind-ui";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface, ListViewTypes } from "../index";
import RowCell from "../RowCell.vue";
import { keys, map, values } from "lodash-es";
import type { RowElement } from "../../../scenario.types";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const presentation = clientEmails.presentation;
const rows = [defaultRow, unverifiedRow];

const ACTIONS: SurfaceActions = {
  remove: vi.fn(),
  setDefault: vi.fn(),
  verify: vi.fn()
};

const fakeTable = (emit = vi.fn()) => ({
  read: () => ({
    filter: {},
    sort: [],
    pagination: { page: 1, perPage: 10, total: rows.length }
  }),
  emit
});

function mountList(emit = vi.fn()) {
  const wrapper = mount(ListSurface, {
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
      table: fakeTable(emit)
    }
  });
  return { wrapper, emit };
}

type Wrapper = ReturnType<typeof mountList>["wrapper"];

const view = (wrapper: Wrapper, next: ListViewTypes) =>
  wrapper.find(`[data-test-value="${next}"]`).trigger("click");

/** The declared elements each rendered card actually drew, in DOM order. */
const drawnIn = (root: { findAllComponents: Wrapper["findAllComponents"] }) =>
  map(
    root.findAllComponents(RowCell),
    cell => (cell.props("element") as RowElement).scope
  );

const declaredScopes = (elements: RowElement[] = []) => map(elements, "scope");

// -----------------------------------------------------------------------------

describe("@AC2 the toggle — two views over one row set", () => {
  it("offers both views and opens on the table", async () => {
    const { wrapper } = mountList();

    for (const value of [ListViewTypes.TABLE, ListViewTypes.CARD]) {
      expect(wrapper.find(`[data-test-value="${value}"]`).exists()).toBe(true);
    }
    expect(wrapper.find("table").exists()).toBe(true);
    expect(wrapper.findAllComponents(Card)).toHaveLength(0);
  });

  it("switches the same rows into cards and back, one card per row", async () => {
    const { wrapper } = mountList();

    await view(wrapper, ListViewTypes.CARD);
    expect(wrapper.findAllComponents(Card)).toHaveLength(rows.length);
    expect(wrapper.find("table").exists()).toBe(false);

    await view(wrapper, ListViewTypes.TABLE);
    expect(wrapper.find("table").exists()).toBe(true);
    expect(wrapper.findAllComponents(Card)).toHaveLength(0);
  });

  it("costs no request — the rows are the ones already in hand", async () => {
    const { wrapper, emit } = mountList();

    await view(wrapper, ListViewTypes.CARD);
    await view(wrapper, ListViewTypes.TABLE);

    expect(emit).not.toHaveBeenCalled();
    for (const action of values(ACTIONS)) {
      expect(action).not.toHaveBeenCalled();
    }
  });
});

describe("@AC3 the card draws the CARD declaration — the scenario's second one", () => {
  it("draws every declared card field, in the declaration's own order", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const cards = wrapper.findAllComponents(Card);
    expect(cards).toHaveLength(rows.length);
    for (const card of cards) {
      expect(drawnIn(card)).toEqual(
        declaredScopes(presentation.card?.elements)
      );
    }
  });

  it("draws the card declaration rather than the table's — the two differ in order", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const cardOrder = declaredScopes(presentation.card?.elements);
    const rowOrder = declaredScopes(presentation.row?.elements);

    expect(cardOrder).not.toEqual(rowOrder);
    expect(drawnIn(wrapper.findAllComponents(Card)[0])).toEqual(cardOrder);
  });

  it("puts the declared TITLE field in the card's heading", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const heading = wrapper.findAllComponents(Card)[0].find("h3");
    const title = presentation.card?.elements[0] as RowElement;

    expect(drawnIn(heading)).toEqual([title.scope]);
    expect(heading.text()).toContain(defaultRow.email);
  });

  it("draws the declared BADGES field, so status reads as badges in cards too", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const badges = wrapper
      .findAllComponents(Card)[0]
      .findAll('[data-test-key="badge"]');

    // D15: default-ness is the marker column's one job, so Status carries the
    // remaining flags only — a Default badge here would tell the same fact twice.
    expect(map(badges, badge => badge.text())).toEqual(["Verified"]);
  });

  it("draws NOTHING the card declaration did not declare", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const drawn = drawnIn(wrapper.findAllComponents(Card)[0]);
    expect(drawn).toHaveLength(presentation.card?.elements.length as number);
    expect(wrapper.text()).not.toContain(defaultRow.id);
  });

  it("keeps the table view on the ROW declaration — one cell renderer, two declarations", () => {
    const { wrapper } = mountList();

    const cells = drawnIn(wrapper.findAll("tbody tr")[0]);
    expect(cells).toEqual(declaredScopes(presentation.row?.elements));
  });
});
