// -----------------------------------------------------------------------------
/**
 * @module surfaces/__tests__/table-geometry
 * @description Where the canary's table columns sit. The declared elements are
 * framed by two columns no declaration names and the surface adds itself: the
 * D14 marker at the head, carrying no header of its own, and the D11 actions
 * anchor at the tail. Counted here once so a spec asserting a cell's position
 * says which column it means rather than re-deriving the arithmetic.
 */

import clientEmails from "../../../../useClientEmails/scenario";

// -----------------------------------------------------------------------------

export const DECLARED_COLUMNS = clientEmails.presentation.row.elements
  .length as number;

export const MARKER_COLUMN = 0;
export const FIRST_DECLARED_COLUMN = 1;
export const ACTIONS_COLUMN = FIRST_DECLARED_COLUMN + DECLARED_COLUMNS;
export const TABLE_COLUMNS = ACTIONS_COLUMN + 1;

/** The declared column labels, translated — what the header row must read. */
export const DECLARED_HEADERS = ["Email address", "Status", "Date bounced"];
