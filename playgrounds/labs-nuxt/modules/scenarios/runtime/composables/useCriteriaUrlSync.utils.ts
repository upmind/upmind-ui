// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useCriteriaUrlSync.utils
 * @description The criteria ⇄ url serialisation, both directions, as pure
 * functions of a schema and a model — no `window`, no watcher, no composable.
 *
 * Both directions walk the schema's DECLARED `(column, operator)` pairs rather
 * than the model's or the url's keys, which is what makes the stale-key hazard
 * structural rather than a discipline: an unknown column fabricated in the url
 * is never read, and an unknown filter column is an HTTP 500, not a silent miss.
 */

import {
  declaredSortFields,
  RequestSortDirection,
  SortDirection
} from "@upmind-automation/headless";
import {
  castArray,
  compact,
  flatMap,
  forEach,
  get,
  has,
  includes,
  isArray,
  isEmpty,
  isFinite,
  isNil,
  isString,
  join,
  keys,
  map,
  set,
  size,
  split,
  startsWith,
  toNumber,
  toString
} from "lodash-es";
import type { JsonSchema } from "@jsonforms/core";
import type { QuerySortEntry } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/** The url's non-filter params — the sort branch and the cursor. */
export const SORT_PARAM = "sort";
export const PAGINATION_PARAMS = ["limit", "offset"];

/**
 * The one statement of the filter param's format, read by both directions.
 *
 * A column declaring no operator sub-schema reaches the API as a bare
 * `filter[column]` (`translateQuery`), and spells the same way here: an
 * operator segment naming an operator that does not exist would be a url the
 * round-trip could never read back.
 */
export function filterParam(column: string, operator?: string): string {
  return operator ? `filter.${column}.${operator}` : `filter.${column}`;
}

/**
 * Every `(column, operator)` pair the schema DECLARES — never the model's keys.
 *
 * A column with NO operator sub-properties is one pair with an `undefined`
 * operator: its value sits directly on the column (`filters.status.code`), not
 * under an operator key. Enumerating only `properties` skipped those columns
 * entirely, which left their url params unreadable and unwritable.
 */
export function declaredPairs(schema: unknown): [string, string | undefined][] {
  return flatMap(
    get(schema, ["properties", "filters", "properties"], {}),
    (columnSchema, column: string) => {
      const operators = keys(get(columnSchema, "properties", {}));
      return isEmpty(operators)
        ? ([[column, undefined]] as [string, string | undefined][])
        : map(
            operators,
            (operator): [string, string | undefined] => [column, operator]
          );
    }
  );
}

/** The model path a declared pair reads and writes. */
const leafPath = (column: string, operator?: string): string[] =>
  operator ? ["filters", column, operator] : ["filters", column];

/** The schema path a declared pair's leaf sits at. */
const leafSchemaPath = (column: string, operator?: string): string[] =>
  operator
    ? ["properties", "filters", "properties", column, "properties", operator]
    : ["properties", "filters", "properties", column];

/**
 * A url string back to the leaf's declared type, or `undefined` when it is not
 * a legal value of that type — which is how a hand-edited url DEGRADES instead
 * of reaching the wire as a lie.
 */
function coerce(leafSchema: unknown, raw: string): unknown {
  const types = castArray(get(leafSchema, "type", "string"));

  if (includes(types, "boolean"))
    return raw === "true" ? true : raw === "false" ? false : undefined;

  if (includes(types, "integer") || includes(types, "number"))
    return isFinite(toNumber(raw)) ? toNumber(raw) : undefined;

  return raw;
}

/** The criteria model → url params. An INACTIVE leaf contributes no key at all. */
export function criteriaToParams(
  schema: unknown,
  model: Record<string, unknown>
): Record<string, string> {
  const params: Record<string, string> = {};

  forEach(declaredPairs(schema), ([column, operator]) => {
    const value = get(model, leafPath(column, operator));
    if (isNil(value) || value === "" || (isArray(value) && isEmpty(value)))
      return;
    // An array column rides ONE param as a comma list, matching the wire.
    params[filterParam(column, operator)] = isArray(value)
      ? join(value, ",")
      : toString(value);
  });

  const sort = get(model, "sort", []) as QuerySortEntry[];
  if (!isEmpty(sort))
    params[SORT_PARAM] = join(
      map(
        sort,
        entry =>
          `${
            entry.dir === SortDirection.DESC
              ? RequestSortDirection.DESC
              : RequestSortDirection.ASC
          }${entry.field}`
      ),
      ","
    );

  forEach(PAGINATION_PARAMS, param => {
    const value = get(model, ["pagination", param]);
    if (!isNil(value)) params[param] = toString(value);
  });

  return params;
}

/** Url params → a criteria seed, carrying only what the schema declares. */
export function paramsToCriteria(
  schema: unknown,
  params: Record<string, unknown>
): Record<string, unknown> {
  const criteria: Record<string, unknown> = {};

  forEach(declaredPairs(schema), ([column, operator]) => {
    const raw = get(params, filterParam(column, operator));
    if (!isString(raw) || isEmpty(raw)) return;

    const leafSchema = get(schema, leafSchemaPath(column, operator));
    const value = includes(castArray(get(leafSchema, "type", "string")), "array")
      ? compact(split(raw, ","))
      : coerce(leafSchema, raw);
    if (!isNil(value) && !(isArray(value) && isEmpty(value)))
      set(criteria, leafPath(column, operator), value);
  });

  const fields = declaredSortFields(schema as JsonSchema);
  const rawSort = get(params, SORT_PARAM);
  if (isString(rawSort) && !isEmpty(rawSort)) {
    const entries = compact(
      map(split(rawSort, ","), token => {
        const descending = startsWith(token, RequestSortDirection.DESC);
        const field = descending
          ? token.slice(size(RequestSortDirection.DESC))
          : token;
        return includes(fields, field)
          ? {
              field,
              dir: descending ? SortDirection.DESC : SortDirection.ASC
            }
          : undefined;
      })
    );
    if (!isEmpty(entries)) set(criteria, SORT_PARAM, entries);
  }

  if (has(schema, ["properties", "pagination", "properties"]))
    forEach(PAGINATION_PARAMS, param => {
      const raw = get(params, param);
      if (!isString(raw) || !isFinite(toNumber(raw))) return;
      set(criteria, ["pagination", param], toNumber(raw));
    });

  return criteria;
}
