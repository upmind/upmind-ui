// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/cells.renderers
 * @description The declared-cell renderer REGISTRY — one entry per cell type,
 * each its own component under its own `uiTypeIs` tester (`R6-36`), registered
 * through the same `registerEntry` seam the form renderers use. A new cell type
 * is an entry here and a component beside it, never a branch in a surface.
 *
 * Every rank is the same because the testers are mutually exclusive: an element
 * carries exactly one `type`, so at most one entry ever claims it and rank has
 * nothing left to settle.
 *
 * An entry also carries what its renderer says about the WIDTH of the column it
 * draws in (`R7-2`), which is what makes intrinsic sizing a property of the
 * renderer rather than a class some surface remembers to add: every table that
 * ever draws a glyph column gets it, this one included.
 */

import { NOT_APPLICABLE } from "@jsonforms/core";
import { registerEntry } from "@upmind-automation/upmind-ui";
import { CellSizingTypes } from "./cells.types";
import TableCellBadges, { tester as badgesTester } from "./TableCellBadges.vue";
import TableCellDate, { tester as dateTester } from "./TableCellDate.vue";
import TableCellIcon, {
  sizing as iconSizing,
  tester as iconTester
} from "./TableCellIcon.vue";
import TableCellText, { tester as textTester } from "./TableCellText.vue";
import { map, maxBy } from "lodash-es";
import type { TableCellRenderer } from "./cells.types";
import type { TableCell } from "../../scenario.types";
import type { JsonSchema, TesterContext } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const tableCellRenderers: TableCellRenderer[] = [
  registerEntry(TableCellText, textTester),
  registerEntry(TableCellDate, dateTester),
  { ...registerEntry(TableCellIcon, iconTester), sizing: iconSizing },
  registerEntry(TableCellBadges, badgesTester)
];

// A declaration points at a MAPPED RECORD, not at a validated JSON Schema
// instance, and every cell tester ranks on the ui type alone — so the two
// schema slots the tester contract requires are left empty rather than invented.
const NO_SCHEMA: JsonSchema = {};
const NO_CONTEXT: TesterContext = { rootSchema: NO_SCHEMA, config: {} };

/**
 * Which registered renderer claims this element — the one resolution, asked by
 * the cell that DRAWS the element and by the frame that has to reserve its
 * column before any row exists. An element no tester claims resolves to
 * nothing, which the declaration's own union makes unreachable.
 */
export function resolveTableCell(
  element: TableCell
): TableCellRenderer | undefined {
  const claimed = maxBy(
    map(tableCellRenderers, entry => ({
      entry,
      rank: entry.tester(element, NO_SCHEMA, NO_CONTEXT)
    })),
    "rank"
  );

  return claimed && claimed.rank > NOT_APPLICABLE ? claimed.entry : undefined;
}

/** How wide the column this element draws in is — its renderer's own answer. */
export function resolveCellSizing(element: TableCell): CellSizingTypes {
  return resolveTableCell(element)?.sizing ?? CellSizingTypes.FLUID;
}
