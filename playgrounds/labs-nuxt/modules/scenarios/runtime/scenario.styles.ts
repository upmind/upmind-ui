// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/scenario.styles
 * @description Centralized ring class constants for the scenario playground.
 *
 * The @upmind/ui package does not yet export ring utilities (the old lib's
 * `useHighlightRing` / `invalidRingClasses` have no new-lib equivalent). This
 * file centralizes the ring constants so the playground uses ONE source rather
 * than scattering literals across styles files (ESC2).
 *
 * When the ui package adds ring utilities, update this file to re-export them
 * and remove the local definitions.
 *
 * It also holds the ONE share→width map a declared `TableColumnWidthTypes`
 * resolves through, read by the table's header cells and the record's fields.
 */

import { TableColumnWidthTypes } from "./scenario.types";

// -----------------------------------------------------------------------------

/** The width class each declared share reserves. */
export const columnWidthClasses: Record<TableColumnWidthTypes, string> = {
  [TableColumnWidthTypes.TWELFTH]: "w-1/12",
  [TableColumnWidthTypes.SIXTH]: "w-1/6",
  [TableColumnWidthTypes.QUARTER]: "w-1/4",
  [TableColumnWidthTypes.THIRD]: "w-1/3",
  [TableColumnWidthTypes.FIVE_TWELFTHS]: "w-5/12",
  [TableColumnWidthTypes.HALF]: "w-1/2",
  [TableColumnWidthTypes.SEVEN_TWELFTHS]: "w-7/12",
  [TableColumnWidthTypes.TWO_THIRDS]: "w-2/3",
  [TableColumnWidthTypes.THREE_QUARTERS]: "w-3/4",
  [TableColumnWidthTypes.FIVE_SIXTHS]: "w-5/6",
  [TableColumnWidthTypes.ELEVEN_TWELFTHS]: "w-11/12",
  [TableColumnWidthTypes.FULL]: "w-full"
};

/**
 * The highlight ring for forced/deliberate mode — primary color, offset for
 * visibility at page scale. Never warning (H2): forcing is a mode the developer
 * chose, not a fault the page is reporting.
 */
export const highlightRingClasses =
  "outline outline-[2px] outline-primary/50 outline-offset-8!";

/**
 * The invalid ring for failed records — primary color, no offset (the element
 * itself is the error boundary). Matches the ui field's own invalid treatment.
 */
export const invalidRingClasses = "outline outline-[2px] outline-primary/50";
