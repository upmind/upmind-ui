/**
 * @module form/renderers/FilterRenderer.types
 * @description The `Filter` renderer's dispatch vocabulary.
 *
 * The OPERATOR vocabulary is not minted here: `RequestFilterOperator`
 * (`@upmind-automation/headless`, `modules/query/query.types.ts`) already names
 * it for all three consumers — the criteria translator, a query schema's
 * declared operator leaves, and this dispatch. Confirmed against the knowledge
 * graph (`graphify-out/`) before adding anything; only the branch vocabulary
 * below was missing.
 */

/**
 * The control the renderer draws for a column, chosen from the column's OWN
 * declared operators. `Unsupported` is a real member rather than an absence:
 * an undispatched shape draws a visible error affordance, never nothing.
 */
export enum FilterBranch {
  Search = "search",
  Switch = "switch",
  Select = "select",
  Range = "range",
  Unsupported = "unsupported"
}

/** One selectable position, its label already translated. */
export type FilterOption = {
  value: string;
  const: unknown;
  title: string;
};

/**
 * The UNSET position's label key — the renderer's ONE label constant, and the
 * single exception to "the schema declares the key": unset has no `oneOf`
 * member to read one from.
 */
export const FILTER_UNSET_I18N_KEY = "text.all";

/** The one-line message an undispatched column draws in place of a control. */
export const FILTER_UNSUPPORTED_I18N_KEY = "error.filter_unsupported";
