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
 * The free-text quick-search param — the schema's own top-level `query` string
 * (`tickets`/`client-notes`), which sits beside `filters` rather than under it
 * and so was never walked by the filter pairs. Persisted only for a schema that
 * declares it; every other collection has no `query` branch and is unaffected.
 */
export const QUERY_PARAM = "query";

/**
 * The operator a BARE-LEAF filter column carries — one whose schema declares no
 * operator `properties` map, so the column IS the leaf (an implicit EQUAL). The
 * empty string is that absence: `filterParam` drops the operator segment for it
 * and both directions address the value at `filters.<column>` rather than one
 * level deeper. Every column of every OTHER collection wraps its value in an
 * operator object, so this is inert for them; `tickets` is the one schema that
 * mixes bare leaves (`reference`/`subject`/`contract_product_id`) with nested
 * ones (`statusCode`/`created_at`), and it was the bare leaves that never
 * reached the url.
 */
const LEAF_OPERATOR = "";

/** The one statement of the filter param's format, read by both directions. */
export function filterParam(column: string, operator: string): string {
  return operator ? `filter.${column}.${operator}` : `filter.${column}`;
}

/** Where a `(column, operator)` pair's value sits in the criteria model. */
function filterPath(column: string, operator: string): string[] {
  return operator ? ["filters", column, operator] : ["filters", column];
}

/**
 * Every `(column, operator)` pair the schema DECLARES — never the model's keys.
 * A column with an operator `properties` map yields one pair per operator; a
 * bare-leaf column (no such map) yields a single {@link LEAF_OPERATOR} pair, so
 * an EQUAL leaf is serialised like any other filter instead of being skipped.
 */
export function declaredPairs(schema: unknown): [string, string][] {
  return flatMap(
    get(schema, ["properties", "filters", "properties"], {}),
    (columnSchema, column: string): [string, string][] => {
      const operators = keys(get(columnSchema, "properties", {}));
      return isEmpty(operators)
        ? [[column, LEAF_OPERATOR]]
        : map(operators, (operator): [string, string] => [column, operator]);
    }
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
    const value = get(model, filterPath(column, operator));
    if (isNil(value) || value === "") return;
    params[filterParam(column, operator)] = toString(value);
  });

  if (has(schema, ["properties", QUERY_PARAM])) {
    const term = get(model, QUERY_PARAM);
    if (!isNil(term) && term !== "") params[QUERY_PARAM] = toString(term);
  }

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

    const leafSchema = get(schema, [
      "properties",
      "filters",
      "properties",
      column,
      ...(operator ? ["properties", operator] : [])
    ]);
    const value = coerce(leafSchema, raw);
    if (!isNil(value)) set(criteria, filterPath(column, operator), value);
  });

  if (has(schema, ["properties", QUERY_PARAM])) {
    const raw = get(params, QUERY_PARAM);
    if (isString(raw) && !isEmpty(raw)) {
      const value = coerce(get(schema, ["properties", QUERY_PARAM]), raw);
      if (!isNil(value)) set(criteria, QUERY_PARAM, value);
    }
  }

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
