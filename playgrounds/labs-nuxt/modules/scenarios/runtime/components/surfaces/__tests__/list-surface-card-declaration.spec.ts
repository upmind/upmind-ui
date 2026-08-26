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
 * `presentation.table` in its order, the card draws `presentation.card` in its
 * order and its slots, and neither view invents a field. Which view is on is the
 * renderer's own ephemeral state (AC2) — no refetch, no declaration, no url.
 *
 * ## What Breaks If These Fail
 * The card becomes a re-labelled table row and the scenario's second declaration
 * goes unread — the card view exists but declares nothing, so every new scenario
 * pays a renderer edit for its card. Or the toggle refetches, and switching how
 * you look at rows costs a round trip.
 */

import { Badge, Card } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultRow, unverifiedRow } from "../../../../testing/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { CardSlotTypes } from "../../../scenario.types";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { CellDispatcher } from "../../cells";
import { ListSurface, ListViewTypes } from "../index";
import { every, filter, keys, map, values } from "lodash-es";
import type { TableCell } from "../../../scenario.types";
import type { SurfaceActions } from "../surface.types";
import type { VueWrapper } from "@vue/test-utils";

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

/**
 * Which view is drawn is url state now (`AC9.1`/K8) — one writer, process-wide
 * and outliving any single mount — so a case that switched view hands it back,
 * rather than leaving the next case booting into the previous one's choice.
 */
let viewed: VueWrapper | undefined;

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
  viewed = wrapper;

  return { wrapper, emit };
}

type Wrapper = ReturnType<typeof mountList>["wrapper"];

const view = (wrapper: Wrapper, next: ListViewTypes) =>
  wrapper.find(`[data-test-value="${next}"]`).trigger("click");

/** The declared elements each rendered card actually drew, in DOM order. */
const drawnIn = (root: { findAllComponents: Wrapper["findAllComponents"] }) =>
  map(
    root.findAllComponents(CellDispatcher),
    cell => (cell.props("element") as TableCell).scope
  );

const declaredScopes = (elements: TableCell[] = []) => map(elements, "scope");

/** The card fields the declaration placed in one named slot, in its own order. */
const slotted = (slot: CardSlotTypes) =>
  declaredScopes(
    filter(presentation.card?.elements, ["options.slot", slot]) as TableCell[]
  );

/** The element the cards are laid out in — the grid itself, whatever it is called. */
const gridOf = (wrapper: Wrapper) =>
  wrapper.findAllComponents(Card)[0].element.parentElement as HTMLElement;

afterEach(async () => {
  const table = viewed?.find(`[data-test-value="${ListViewTypes.TABLE}"]`);
  if (table?.exists()) await table.trigger("click");
  viewed = undefined;
});

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

  it("draws the card declaration rather than the table's — the two differ in SLOTS", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const card = wrapper.findAllComponents(Card)[0];

    expect(drawnIn(card)).toEqual(declaredScopes(presentation.card?.elements));
    expect(drawnIn(card.find("h3"))).toEqual(slotted(CardSlotTypes.TITLE));
    expect(drawnIn(card.find("p"))).toEqual(slotted(CardSlotTypes.SUBTITLE));
    // The table's declaration carries no slots at all, so a card drawn from it
    // could not group into a heading and a line under it in the first place.
    expect(slotted(CardSlotTypes.TITLE)).not.toEqual(
      declaredScopes(presentation.table?.elements)
    );
  });

  it("puts EVERY declared TITLE field on the heading line — badge beside the address (E4)", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const heading = wrapper.findAllComponents(Card)[0].find("h3");

    expect(drawnIn(heading)).toEqual(slotted(CardSlotTypes.TITLE));
    expect(drawnIn(heading).length).toBeGreaterThan(1);
    expect(heading.text()).toContain(defaultRow.email);
    expect(
      map(heading.findAllComponents(Badge), badge => badge.text())
    ).toEqual(["Verified"]);
  });

  it("draws the declared BADGES field, so status reads as badges in cards too", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const badges = wrapper.findAllComponents(Card)[0].findAllComponents(Badge);

    // D15: default-ness is the star cell's one job, so Status carries the
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

  it("keeps the table view on the TABLE declaration — one dispatcher, two declarations", () => {
    const { wrapper } = mountList();

    const cells = drawnIn(wrapper.findAll("tbody tr")[0]);
    expect(cells).toEqual(declaredScopes(presentation.table?.elements));
  });
});

describe("@AC2 the cards are a responsive GRID, not a column (E6)", () => {
  it("lays every card out in ONE grid", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const grid = gridOf(wrapper);
    const cards = map(wrapper.findAllComponents(Card), card => card.element);

    expect(grid.className).toContain("grid");
    expect(every(cards, card => card.parentElement === grid)).toBe(true);
  });

  it("fits three across on desktop and collapses below it", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const grid = gridOf(wrapper).className;

    expect(grid).toContain("lg:grid-cols-3");
    expect(grid).toContain("sm:grid-cols-2");
    expect(grid).not.toContain("grid-cols-1");
  });
});

describe("@AC2 a card reserves no space for what the row never had (E5)", () => {
  it("collapses a slot the record left empty rather than holding its height", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    // The unverified row carries no bounce date, so its SUBTITLE slot draws
    // nothing — the gap the operator saw under the content.
    const subtitle = wrapper.findAllComponents(Card)[1].find("p");

    expect(subtitle.text()).toBe("");
    expect(subtitle.classes()).toContain("empty:hidden");
  });

  it("centres what it does carry instead of pinning it to the top edge", async () => {
    const { wrapper } = mountList();
    await view(wrapper, ListViewTypes.CARD);

    const card = wrapper.findAllComponents(Card)[1];

    expect(card.classes()).toContain("justify-center");
    expect(card.classes()).toContain("h-full");
  });
});
