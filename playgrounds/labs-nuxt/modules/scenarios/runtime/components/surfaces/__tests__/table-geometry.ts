// -----------------------------------------------------------------------------
/**
 * @module surfaces/__tests__/table-geometry
 * @description Where the client-emails page's table columns sit. Under `R6-35`
 * the declared element list IS the whole table — every column, including the
 * default-star, is a declared cell with its own header — and the only column no
 * declaration names is the D11 actions anchor at the tail. Counted here once so
 * a spec asserting a cell's position says which column it means rather than
 * re-deriving the arithmetic.
 */

import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

export const DECLARED_ELEMENTS = clientEmails.presentation.table.elements;

export const DECLARED_COLUMNS = DECLARED_ELEMENTS.length as number;

/** The star is a declared `TableCellIcon` now (`R6-34`), so it is column 0. */
export const MARKER_COLUMN = 0;
export const FIRST_DECLARED_COLUMN = 0;
export const ACTIONS_COLUMN = DECLARED_COLUMNS;
export const TABLE_COLUMNS = ACTIONS_COLUMN + 1;

/** Every declared cell's own i18n key, in the order the table draws them. */
export const DECLARED_SCOPES = map(DECLARED_ELEMENTS, "scope");

/** The declared column labels, translated — what the header row must read. */
export const DECLARED_HEADERS = [
  "Default",
  "Email address",
  "Status",
  "Date bounced"
];

/**
 * Row selector that adapts to the surface's rendering mode: `tbody tr` when a
 * table is drawn (declaration carries columns), `li` when it degrades to a list
 * (no columns). Use this rather than hard-coding `li` — the contract change
 * means hasTable no longer requires query-state ownership.
 */
export const ROW_SELECTOR = "tbody tr, li";

/**
 * Returns all row elements from a ListSurface wrapper, regardless of whether
 * the surface draws a table or a list.
 */
export function getRows(wrapper: VueWrapper<unknown>) {
  const table = wrapper.find("table");
  return table.exists() ? wrapper.findAll("tbody tr") : wrapper.findAll("li");
}

/**
 * Returns the row element at the given index.
 */
export function getRow(wrapper: VueWrapper<unknown>, index: number) {
  return getRows(wrapper)[index];
}
