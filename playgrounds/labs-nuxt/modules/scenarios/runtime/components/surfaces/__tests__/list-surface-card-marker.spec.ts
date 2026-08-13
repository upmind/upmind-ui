// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the default row reads as the default — in BOTH views (C12,
 * operator: *"highlight the default with an icon and maybe a colour variant…
 * industry standard"*).
 *
 * ## Job To Be Done
 * Exactly one address is the default, and the operator could not tell which by
 * looking. The treatment is a declared CELL now (`R6-34`) — a `TableCellIcon`
 * scoped at the row's own `meta.isDefault`, named once in the table declaration
 * and again in the card's, where it rides the TITLE slot. So the star must ride
 * the rows into whichever view is on: the same records telling two different
 * stories depending on the toggle is the defect, not the feature.
 *
 * ## What Breaks If These Fail
 * The default row is obvious in the table and anonymous in cards (or the other
 * way round), so `set as default` being absent on it reads as missing rather
 * than intentional — and C11's withheld control loses the visual answer that
 * explains it.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Card, Icon } from "@upmind-automation/upmind-ui";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface, ListViewTypes } from "../index";
import { MARKER_COLUMN } from "./table-geometry";
import { find } from "lodash-es";
import { filter, keys, map } from "lodash-es";
import type { TableCellIcon } from "../../../scenario.types";
import type { SurfaceActions } from "../surface.types";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const presentation = clientEmails.presentation;
const rows = [defaultRow, unverifiedRow];

/** Row 0 IS the default; row 1 is not — the capture run's own two records. */
const MARKED = 0;
const UNMARKED = 1;

const ACTIONS: SurfaceActions = {
  remove: vi.fn(),
  setDefault: vi.fn(),
  verify: vi.fn()
};

/**
 * Which view is drawn is url state now (`AC9.1`/K8) — one writer, process-wide
 * and outliving any single mount — so a case that switched view hands it back,
 * rather than leaving the next case booting into the previous one's choice.
 */
let viewed: VueWrapper | undefined;

function mountList() {
  viewed = mount(ListSurface, {
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

  return viewed;
}

type Wrapper = ReturnType<typeof mountList>;

/** The star cell, in each declaration — found by the renderer its type names. */
const iconCellIn = (elements: { type: string }[] = []) =>
  find(elements, { type: "TableCellIcon" }) as TableCellIcon | undefined;

const DECLARED_MARKER = iconCellIn(presentation.table?.elements);

/**
 * The declared marker's drawn STATE inside one element — the icon pack variant,
 * since D14 draws the same glyph either way and only the variant says which row
 * is the default. Scoped to that element on purpose: the row's own controls
 * declare the SAME icon for `set as default`, so a whole-row sweep would count a
 * button as a marker and pass with the marker deleted.
 */
const markerStatesIn = (root: {
  findAllComponents: Wrapper["findAllComponents"];
}) =>
  map(
    filter(
      root.findAllComponents(Icon),
      icon => icon.props("icon") === DECLARED_MARKER?.options.icon
    ),
    icon => icon.props("variant")
  );

/** The table's own marker column — its position and states are D14's spec. */
const markerCellOf = (wrapper: Wrapper, row: number) =>
  wrapper.findAll("tbody tr")[row].findAll("td")[MARKER_COLUMN];

const cardOf = (wrapper: Wrapper, row: number) =>
  wrapper.findAllComponents(Card)[row];

afterEach(async () => {
  const table = viewed?.find(`[data-test-value="${ListViewTypes.TABLE}"]`);
  if (table?.exists()) await table.trigger("click");
  viewed = undefined;
});

// -----------------------------------------------------------------------------

describe("@AC3 the marker is DECLARED, not chosen by the renderer", () => {
  it("declares the flag it reads and the icon it draws", () => {
    expect(DECLARED_MARKER?.scope).toBe(
      "#/properties/meta/properties/isDefault"
    );
    expect(DECLARED_MARKER?.options.icon).toBeTruthy();
    expect(defaultRow.meta.isDefault).toBe(true);
    expect(unverifiedRow.meta.isDefault).toBe(false);
  });

  it("points both views at the same flag and the same glyph", () => {
    const card = iconCellIn(presentation.card?.elements);

    expect(card?.scope).toBe(DECLARED_MARKER?.scope);
    expect(card?.options.icon).toBe(DECLARED_MARKER?.options.icon);
  });
});

describe("@AC3 the marker rides the CARD view too", () => {
  it("draws the declared glyph on the default card's heading", async () => {
    const wrapper = mountList();
    const filled = markerStatesIn(markerCellOf(wrapper, MARKED));
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    expect(markerStatesIn(cardOf(wrapper, MARKED).find("header"))).toEqual(
      filled
    );
  });

  it("draws its other treatment on every other card's heading, exactly as the table does", async () => {
    const wrapper = mountList();
    const outlined = markerStatesIn(markerCellOf(wrapper, UNMARKED));
    const filled = markerStatesIn(markerCellOf(wrapper, MARKED));
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    expect(markerStatesIn(cardOf(wrapper, UNMARKED).find("header"))).toEqual(
      outlined
    );
    expect(outlined).not.toEqual(filled);
  });

  it("tells the same record's story in either view — never one per toggle", async () => {
    const wrapper = mountList();
    const inTable = map([MARKED, UNMARKED], row =>
      markerStatesIn(markerCellOf(wrapper, row))
    );

    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");
    const inCards = map([MARKED, UNMARKED], row =>
      markerStatesIn(cardOf(wrapper, row).find("header"))
    );

    expect(inCards).toEqual(inTable);
    expect(inCards[MARKED]).not.toEqual(inCards[UNMARKED]);
  });
});
