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
import type { QuerySortEntry } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/** The url's non-filter params — the sort branch and the cursor. */
export const SORT_PARAM = "sort";
export const PAGINATION_PARAMS = ["limit", "offset"];

/** The one statement of the filter param's format, read by both directions. */
export function filterParam(column: string, operator: string): string {
  return `filter.${column}.${operator}`;
}

/** Every `(column, operator)` pair the schema DECLARES — never the model's keys. */
export function declaredPairs(schema: unknown): [string, string][] {
  return flatMap(
    get(schema, ["properties", "filters", "properties"], {}),
    (columnSchema, column: string) =>
      map(
        keys(get(columnSchema, "properties", {})),
        (operator): [string, string] => [column, operator]
      )
  );
}

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
    const value = get(model, ["filters", column, operator]);
    if (isNil(value) || value === "") return;
    params[filterParam(column, operator)] = toString(value);
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

    const value = coerce(
      get(schema, [
        "properties",
        "filters",
        "properties",
        column,
        "properties",
        operator
      ]),
      raw
    );
    if (!isNil(value)) set(criteria, ["filters", column, operator], value);
  });

  const fields = get(
    schema,
    ["properties", "sort", "items", "properties", "field", "enum"],
    []
  ) as string[];
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
