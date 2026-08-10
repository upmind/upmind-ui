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
  Boolean = "boolean",
  Select = "select",
  Range = "range",
  Unsupported = "unsupported"
}

/**
 * The CONTROL a boolean tri-state column draws, named by the column's own
 * uischema (`options.treatment`) rather than by its schema: both treatments
 * serve the identical three states, so which one a bar wants is presentation.
 *
 * `ButtonGroup` shows all three positions beside the column's label
 * (`All │ Yes │ No`). `ToggleGroup` drops the label entirely and carries the
 * state names in the options themselves (`Bounced │ Not bounced`), where
 * un-clicking the active position is the unset.
 *
 * A tri-state whose uischema names no treatment falls back to `ButtonGroup` —
 * the treatment that shows its unset position, so no bar can lose its clear.
 */
export enum FilterTreatment {
  ButtonGroup = "button-group",
  ToggleGroup = "toggle-group"
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

/**
 * The model value every single-select control carries while UNSET. Radix reads
 * `modelValue === undefined` ONCE, at setup, as "uncontrolled" — so an unset
 * tri-state must still bind a defined value or the control silently stops
 * following the model. No option's value is empty, so no position is pressed.
 */
export const FILTER_UNSET_VALUE = "";

/** The one-line message an undispatched column draws in place of a control. */
export const FILTER_UNSUPPORTED_I18N_KEY = "error.filter_unsupported";

/**
 * The uischema `options` keys this renderer OWNS. Named because they are read
 * AND withheld: `useUpmindUIRenderer` hands the whole `options` bag to
 * `FormField` as props, so an option no `FormControlProps` declares falls
 * through onto the rendered element as an attribute.
 */
export const FILTER_TREATMENT_OPTION = "treatment";
export const FILTER_STATES_OPTION = "states";
