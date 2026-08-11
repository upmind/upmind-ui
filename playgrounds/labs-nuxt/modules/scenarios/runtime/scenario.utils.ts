// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/scenario.utils
 * @description Reading a DECLARATION against a live row — the three operations
 * every surface needs and none may re-derive: resolve a declared `scope`
 * pointer to that row's value, and settle a declared `rule` for enablement and
 * for visibility.
 *
 * All three delegate to `@jsonforms/core`'s own runtime — the same evaluator
 * the form renderer already runs rules through — over the shared ajv instance
 * `client-vue`'s `Form.vue` uses, so a scenario's rules behave exactly as a
 * form's do and no second rule engine exists to drift.
 */

import {
  Resolve,
  evalEnablement,
  evalVisibility,
  toDataPath
} from "@jsonforms/core";
import { useValidation } from "@upmind-automation/headless";
import type { Rule, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

/**
 * Anything carrying a declared rule — a column, a card field, or an action.
 * JSONForms' evaluators read `uischema.rule` and nothing else, so an action
 * (which is not a uischema element) settles through the same evaluator rather
 * than a second one written to accept it.
 */
type RuleBearing = { rule?: Rule };

/** The row's own path — a declared scope is already absolute against the row. */
const ROW_PATH = "";

/** The value a declared `scope` pointer addresses on one row. */
export function resolveScope(
  row: Record<string, unknown>,
  scope: string
): unknown {
  return Resolve.data(row, toDataPath(scope));
}

/** Whether a declared control is ENABLED for this row. */
export function isRuleEnabled(
  element: RuleBearing,
  row: Record<string, unknown>
): boolean {
  if (!element.rule) return true;

  return evalEnablement(
    element as UISchemaElement,
    row,
    ROW_PATH,
    useValidation().ajv,
    undefined
  );
}

/** Whether a declared control is VISIBLE for this row. */
export function isRuleVisible(
  element: RuleBearing,
  row: Record<string, unknown>
): boolean {
  if (!element.rule) return true;

  return evalVisibility(
    element as UISchemaElement,
    row,
    ROW_PATH,
    useValidation().ajv,
    undefined
  );
}
