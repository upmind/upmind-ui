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
import { compact, get, isNil, isString, split } from "lodash-es";
import type { ScenarioTracks } from "./scenario.types";
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

/**
 * The value a handoff's `context.from` addresses on one row. A JSON Pointer
 * (`/id`), NOT a uischema scope: it points into the row's data, where a scope
 * points into its schema, and `toDataPath` resolves the two differently.
 */
export function resolvePointer(
  row: Record<string, unknown>,
  pointer: string
): unknown {
  return get(row, compact(split(pointer, "/")));
}

/** The first year a real date may carry; earlier is the API's zero sentinel. */
const EPOCH_YEAR = 1970;

const YEAR = /\b(\d{4})\b/;

/**
 * Whether a `useDate` descriptor (`{ date, relative }`), or a raw wire date
 * string, carries NO real date —
 * absent, empty, or the API's zero sentinel (`1899-12-30`, the epoch) that
 * would otherwise draw as "127 years ago". The mapper publishes only the
 * formatted `date`, so the year is read off it.
 */
export function isAbsentDate(value: unknown): boolean {
  const date = isString(value) ? value : get(value, "date");
  if (isNil(date) || date === "") return true;
  const year = Number(YEAR.exec(String(date))?.[1]);
  return !!year && year <= EPOCH_YEAR;
}

/**
 * The NAME a declared route param binds under — `id` out of
 * `id([0-9a-fA-F-]{36})?`, the pattern and the optional mark stripped.
 */
export function paramNameOf(param?: string): string | undefined {
  return param?.match(/^\w+/)?.[0];
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

/**
 * The module name out of a declaration's `tracks`, whichever form it takes.
 *
 * `tracks` is the module's own NAME, except on a page PAIRED over one feature,
 * where it also carries the lane that page does not play (`ScenarioTracks`).
 * Every consumer that wants the name alone — the corpus seam, the integration
 * kits, the traceability oracle — reads it through here, so widening the
 * declaration did not put a cast at each of them.
 */
export function trackedModuleOf(tracks?: ScenarioTracks): string | undefined {
  return isString(tracks) ? tracks : tracks?.module;
}

/** The scenario tags a declaration's page leaves OUT; none for an unpaired page. */
export function excludedTagsOf(
  tracks?: ScenarioTracks
): readonly string[] | undefined {
  return isString(tracks) ? undefined : tracks?.without;
}

/**
 * The harness key of an area's panel — `<area key>.<panel key>`. One statement
 * of the format, read by the registry that flattens the area and by anything
 * that addresses a panel by it.
 */
export function panelKeyOf(area: string, panel: string): string {
  return `${area}.${panel}`;
}
