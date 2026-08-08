// -----------------------------------------------------------------------------
/**
 * @module factory/useCriteriaUrlSync
 * @description Page-level opt-in persistence of the whole request state to the
 * browser url (W-D33), so a refresh does not lose where you are. The mechanism
 * is the one already established in client-vue — VueUse `useUrlSearchParams`
 * at the page, never inside the list widget (`Catalogue.vue:121`,
 * `WidgetGrid.vue:190`) — and the surface stays dumb: the model remains
 * composable-owned and every write goes through the criteria's own merging
 * `set`, so a rehydrated url can no more clear a live sort than a header
 * filter can.
 *
 * It serialises the CRITERIA, one object in and one object out, which is what
 * makes the stale-key hazard structural rather than a discipline: both
 * directions walk the schema's DECLARED `(column, operator)` pairs, so an
 * unknown column fabricated in the url is never read — and an unknown filter
 * column is an HTTP 500, not a silent miss.
 */

import { useUrlSearchParams } from "@vueuse/core";
import { watch } from "vue";
import { SortDirection } from "@upmind-automation/headless";
import {
  assign,
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
  split,
  startsWith,
  toNumber,
  toString
} from "lodash-es";
import type { ModulePortCriteria } from "./useModulePort.types";
import type { QuerySortEntry } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/** The url's non-filter params — the sort branch and the cursor. */
const SORT_PARAM = "sort";
const PAGINATION_PARAMS = ["limit", "offset"];

/** The one statement of the filter param's format, read by both directions. */
function filterParam(column: string, operator: string): string {
  return `filter.${column}.${operator}`;
}

/** Every `(column, operator)` pair the schema DECLARES — never the model's keys. */
function declaredPairs(schema: unknown): [string, string][] {
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
        entry => `${entry.dir === SortDirection.DESC ? "-" : ""}${entry.field}`
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
        const descending = startsWith(token, "-");
        const field = descending ? token.slice(1) : token;
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

// -----------------------------------------------------------------------------

/**
 * Reads the criteria out of the url on boot and writes it back on every
 * change.
 *
 * @param criteria The port's criteria handle, absent for a module that owns no
 * request state — in which case there is nothing to persist and this no-ops.
 * @param options `enabled` is the page-level opt-in; persistence is off unless
 * the scenario asks for it.
 */
export function useCriteriaUrlSync(
  criteria?: ModulePortCriteria,
  options: { enabled?: boolean } = {}
): void {
  // No `window` means no url to sync — a server render, or a spec that has not
  // stood a DOM up.
  if (!criteria || !options.enabled || typeof window === "undefined") return;

  const params = useUrlSearchParams<Record<string, string>>("history", {
    // `removeFalsyValues` is deliberately NOT set: a tri-state filter's `false`
    // is an ACTIVE choice, and the precedent's falsy-drop would erase it.
    removeNullishValues: true
  });

  const seeded = paramsToCriteria(criteria.schema, params);
  if (!isEmpty(seeded)) criteria.set(seeded);

  const owned = [
    ...map(declaredPairs(criteria.schema), ([column, operator]) =>
      filterParam(column, operator)
    ),
    SORT_PARAM,
    ...PAGINATION_PARAMS
  ];

  watch(
    criteria.model,
    model => {
      const next = criteriaToParams(criteria.schema, model);
      forEach(owned, param => {
        if (!has(next, param)) delete params[param];
      });
      assign(params, next);
    },
    { deep: true, immediate: true }
  );
}
