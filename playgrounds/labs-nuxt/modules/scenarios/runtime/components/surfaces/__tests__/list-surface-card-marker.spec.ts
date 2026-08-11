// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the default row reads as the default — in BOTH views (C12,
 * operator: *"highlight the default with an icon and maybe a colour variant…
 * industry standard"*).
 *
 * ## Job To Be Done
 * Exactly one address is the default, and the operator could not tell which by
 * looking. The treatment is declared once — `presentation.row.options.marker`,
 * a pointer into the row's own `meta.isDefault` plus the icon to draw — and the
 * card declaration reuses that same object. So the marker must ride the rows
 * into whichever view is on: the same records telling two different stories
 * depending on the toggle is the defect, not the feature.
 *
 * ## What Breaks If These Fail
 * The default row is obvious in the table and anonymous in cards (or the other
 * way round), so `set as default` being absent on it reads as missing rather
 * than intentional — and C11's withheld control loses the visual answer that
 * explains it.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Card, Icon } from "@upmind-automation/upmind-ui";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface, ListViewTypes } from "../index";
import { MARKER_COLUMN } from "./table-geometry";
import { filter, keys, map } from "lodash-es";
import type { SurfaceActions } from "../surface.types";

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

const DECLARED_MARKER = presentation.row?.options?.marker;

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
      icon => icon.props("icon") === DECLARED_MARKER?.icon
    ),
    icon => icon.props("variant")
  );

/** The table's own marker column — its position and states are D14's spec. */
const markerCellOf = (wrapper: Wrapper, row: number) =>
  wrapper.findAll("tbody tr")[row].findAll("td")[MARKER_COLUMN];

const cardOf = (wrapper: Wrapper, row: number) =>
  wrapper.findAllComponents(Card)[row];

// -----------------------------------------------------------------------------

describe("@AC3 the marker is DECLARED, not chosen by the renderer", () => {
  it("declares the flag it reads and the icon it draws", () => {
    expect(DECLARED_MARKER?.scope).toBe(
      "#/properties/meta/properties/isDefault"
    );
    expect(DECLARED_MARKER?.icon).toBeTruthy();
    expect(defaultRow.meta.isDefault).toBe(true);
    expect(unverifiedRow.meta.isDefault).toBe(false);
  });

  it("shares one marker declaration across both views", () => {
    expect(presentation.card?.options?.marker).toEqual(DECLARED_MARKER);
  });
});

describe("@AC3 the marker rides the CARD view too", () => {
  it("fills the default card's heading with the SAME declared glyph", async () => {
    const wrapper = mountList();
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    expect(markerStatesIn(cardOf(wrapper, MARKED).find("header"))).toEqual([
      DECLARED_MARKER?.marked
    ]);
  });

  it("outlines it on every other card's heading, exactly as the table does", async () => {
    const wrapper = mountList();
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    expect(markerStatesIn(cardOf(wrapper, UNMARKED).find("header"))).toEqual([
      DECLARED_MARKER?.unmarked
    ]);
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
