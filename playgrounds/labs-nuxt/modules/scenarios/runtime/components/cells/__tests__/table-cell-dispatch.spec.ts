// -----------------------------------------------------------------------------
/**
 * @module cells/__tests__/table-cell-dispatch.spec
 * @description `R6-36` — a declared cell is drawn by the renderer its own `type`
 * NAMES, resolved through the registry's testers. The surface holds no switch:
 * the element list says `TableCellIcon` and a glyph appears, says
 * `TableCellBadges` and badges appear, and adding a fifth type is a registry
 * entry rather than a branch.
 *
 * ## What Breaks If These Fail
 * Every cell collapses to whichever renderer happens to be first — the
 * pre-ruling `options.cell` switch wearing the new element names, where the
 * declaration reads as a table and draws as a column of text.
 *
 * Negative controls: `table-cell-dispatch.must-fail.patch`,
 * `table-cell-tester.must-fail.patch`.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import text from "@upmind-automation/i18n/core/text-en.json";
import { Badge, Icon } from "@upmind-automation/upmind-ui";
import { defaultRow } from "../../../../testing/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { CellDispatcher } from "../index";
import { find, map } from "lodash-es";
import type { TableCell, TableCellDate } from "../../../scenario.types";

// -----------------------------------------------------------------------------

const messages = { en: { text } };

const declared = (type: TableCell["type"]) =>
  find(clientEmails.presentation.table.elements, { type }) as TableCell;

/**
 * The one cell type the recorded rows carry no value for: `bouncedAt` is null on
 * every capture, so the declared element is re-scoped onto the date every
 * recorded record DOES hold rather than a timestamp invented to fill it.
 */
const dateCell = {
  ...(declared("TableCellDate") as TableCellDate),
  scope: "#/properties/createdAt"
};

const draw = (element: TableCell, row = defaultRow) =>
  mount(CellDispatcher, {
    props: { element, row },
    global: { plugins: [createI18n({ legacy: false, locale: "en", messages })] }
  });

// -----------------------------------------------------------------------------

describe("R6-36 each declared cell draws through the renderer its type names", () => {
  it("draws a TableCellText element as the field's own value", () => {
    expect(draw(declared("TableCellText")).text()).toContain(defaultRow.email);
  });

  it("draws a TableCellDate element as the descriptor's relative form", () => {
    expect(draw(dateCell).text()).toContain(defaultRow.createdAt.relative);
  });

  it("draws a TableCellIcon element as the glyph the declaration named", () => {
    const icons = draw(declared("TableCellIcon")).findAllComponents(Icon);

    expect(map(icons, icon => icon.props("icon"))).toEqual(["star-01"]);
  });

  it("draws a TableCellBadges element as one badge per truthy declared flag", () => {
    const badges = draw(declared("TableCellBadges")).findAllComponents(Badge);

    expect(badges.length).toBeGreaterThan(0);
    expect(map(badges, badge => badge.props("label"))).toEqual(["Verified"]);
  });
});

describe("R6-36 no two types draw the same, so the list means what it says", () => {
  it("gives the icon cell a glyph the text cell does not have", () => {
    expect(
      draw(declared("TableCellIcon")).findAllComponents(Icon)
    ).toHaveLength(1);
    expect(
      draw(declared("TableCellText")).findAllComponents(Icon)
    ).toHaveLength(0);
  });

  it("gives the badges cell badges no other declared cell raises", () => {
    const others: TableCell["type"][] = [
      "TableCellText",
      "TableCellDate",
      "TableCellIcon"
    ];

    expect(
      map(others, type => draw(declared(type)).findAllComponents(Badge).length)
    ).toEqual([0, 0, 0]);
  });

  it("draws nothing at all for an element no registered tester claims", () => {
    const unclaimed = {
      ...declared("TableCellText"),
      type: "TableCellNobodyRegistered"
    } as unknown as TableCell;

    expect(draw(unclaimed).text()).toBe("");
  });
});
