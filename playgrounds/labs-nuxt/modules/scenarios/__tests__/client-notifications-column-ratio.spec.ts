// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications table column shares
 *
 * ## Job To Be Done
 * The notifications table sizes its fluid columns unequally so a long topic
 * description does not starve the short topic name or the status badges. The
 * declaration reserves a sixth of the row for the topic name, seven-twelfths for
 * the description and a sixth for the status; the one column no declaration
 * names — the row-actions anchor at the tail — is left exactly one twelfth, the
 * minimal remainder, so the content columns read 2:7:2 and the actions column
 * never widens to a fluid share on a wide screen.
 *
 * ## What Breaks If These Fail
 * A sized column reverts to an equal fluid share, or the actions column reclaims
 * more than its one twelfth: the description narrows until topic copy wraps, or
 * an empty actions column balloons on a 2400px screen — the exact starving the
 * width vocabulary was added to cure.
 */

import { describe, expect, it } from "vitest";
import { TableColumnWidthTypes } from "../runtime/scenario.types";
import { tableUischema } from "../useClientNotifications/client-notifications.presentation";
import { find, map, sum } from "lodash-es";
import type { TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const columnAt = (scope: string): TableCell => {
  const cell = find(tableUischema.elements, { scope });
  if (!cell) throw new Error(`No declared column at scope ${scope}`);
  return cell;
};

/** The row is twelve twelfths; each declared enum member is that many of them. */
const TWELFTHS: Partial<Record<TableColumnWidthTypes, number>> = {
  [TableColumnWidthTypes.SIXTH]: 2,
  [TableColumnWidthTypes.SEVEN_TWELFTHS]: 7
};

const NAME = "#/properties/name";
const DESCRIPTION = "#/properties/description";
const META = "#/properties/meta";

// -----------------------------------------------------------------------------

describe("client-notifications table column shares", () => {
  it("reserves a sixth of the row for the topic name", () => {
    expect(columnAt(NAME).options?.width).toBe(TableColumnWidthTypes.SIXTH);
  });

  it("reserves seven-twelfths of the row for the topic description", () => {
    expect(columnAt(DESCRIPTION).options?.width).toBe(
      TableColumnWidthTypes.SEVEN_TWELFTHS
    );
  });

  it("reserves a sixth of the row for the status badges", () => {
    expect(columnAt(META).options?.width).toBe(TableColumnWidthTypes.SIXTH);
  });

  it("declares exactly the three sized columns, so the tail actions column is the fourth", () => {
    expect(tableUischema.elements).toHaveLength(3);
  });

  it("leaves the undeclared row-actions column exactly one twelfth", () => {
    const declared = map(
      [NAME, DESCRIPTION, META],
      scope => TWELFTHS[columnAt(scope).options!.width!]
    );
    const actions = 12 - sum(declared);
    expect([...declared, actions]).toEqual([2, 7, 2, 1]);
  });
});
