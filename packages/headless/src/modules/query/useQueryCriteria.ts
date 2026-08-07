import { computed, ref } from "vue";
import { useI18n } from "../system-localisation";
import {
  RequestFilterOperator,
  RequestSortDirection,
  SortDirection
} from "./query.types";
import {
  compactDeep,
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import {
  assign,
  filter,
  get,
  includes,
  isArray,
  isBoolean,
  isEmpty,
  isNil,
  isString,
  join,
  map,
  reduce,
  size
} from "lodash-es";
import type {
  QueryCriteria,
  QueryCriteriaOptions,
  QueryProps,
  QuerySortEntry,
  RequestFilters,
  RequestPagination,
  ValidationErrorObject
} from "./query.types";
import type { ResponseError } from "../../utils";
import type { JsonSchema } from "@jsonforms/core";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module query/useQueryCriteria
 * @description A collection's REQUEST STATE as a schema-governed model, in one
 * place: intent → parse → validate → translate. It takes ONE input — the
 * declared `{ schema, model? }` pair — and knows nothing about fetching, urls,
 * vue-query or scope, so it can be exercised with no HTTP at all.
 *
 * It is an implementation seam, not an integration step: `list()` constructs it
 * from `options.criteria`, so a module declares a schema and passes it and can
 * never wire the pipeline wrongly.
 */
// -----------------------------------------------------------------------------

/**
 * One filter leaf → its wire string. Inactive (nil/empty string) → `""`, the
 * CLEARING value `useQuery`'s serialiser deletes; active always a NON-empty
 * string so the lodash falsy-drop cannot eat a boolean filter.
 * `like`/`nlike` get the `%` wildcards (the model holds the bare term so a
 * rehydrate cannot double-wrap); booleans map to `"1"`/`"0"`; an array leaf
 * comma-joins.
 */
function toWireFilterValue(operator: string, value: unknown): string {
  if (isNil(value) || (isString(value) && isEmpty(value))) return "";
  if (
    includes(
      [RequestFilterOperator.LIKE, RequestFilterOperator.NOT_LIKE],
      operator
    )
  )
    return `%${value}%`;
  if (isBoolean(value)) return value ? "1" : "0";
  if (isArray(value)) return join(value, ",");
  return String(value);
}

/**
 * The ONE translator: the whole query model → the `QueryProps` the query layer
 * already accepts. Generic and schema-injected — it imports nothing
 * module-specific.
 *
 * `filters` walks the schema's DECLARED `(column, operator)` pairs — never the
 * model's keys — so it emits exactly one key per declared filter, active as its
 * wire value and inactive as `""`. `sort` re-shapes `{field,dir}[]` to the
 * `[direction, property]` tuple form, dropping any field the schema's enum does
 * not declare (an unknown `order=` column is an HTTP 500). `pagination` passes
 * through. A FRESH object every call so `useQuery`'s `isEqual` guard is a value
 * comparison and `pageIndex` resets.
 */
function translateQuery(
  schema: JsonSchema,
  model: Record<string, unknown>
): QueryProps {
  const filters = reduce(
    get(schema, ["properties", "filters", "properties"], {}),
    (result: RequestFilters, columnSchema, column) =>
      reduce(
        get(columnSchema, "properties", {}),
        (acc: RequestFilters, _operatorSchema, operator) => {
          acc[`filter[${column}|${operator}]`] = toWireFilterValue(
            operator,
            get(model, ["filters", column, operator])
          );
          return acc;
        },
        result
      ),
    {}
  );

  const sortFields = get(
    schema,
    ["properties", "sort", "items", "properties", "field", "enum"],
    []
  ) as string[];
  const tuples = map(
    filter(get(model, "sort", []) as QuerySortEntry[], entry =>
      includes(sortFields, entry.field)
    ),
    entry =>
      [
        entry.dir === SortDirection.ASC
          ? RequestSortDirection.ASC
          : RequestSortDirection.DESC,
        entry.field
      ] as [RequestSortDirection, string]
  );

  return {
    filters,
    sort: size(tuples) === 1 ? tuples[0] : tuples,
    pagination: get(model, "pagination") as RequestPagination | undefined
  };
}

// -----------------------------------------------------------------------------

/**
 * The request state for one collection, governed by its declared query schema.
 *
 * @param options - {@link QueryCriteriaOptions} — the declared `schema`, and an
 * optional starting `model` (untrusted; see the type).
 * @returns {@link QueryCriteria} — the model, the schema, the translated wire
 * props, ajv's verdict, the filtered flag, and the ONE write verb.
 */
export function useQueryCriteria<
  TModel extends Record<string, unknown> = Record<string, unknown>
>({
  schema,
  model: seed
}: QueryCriteriaOptions<TModel>): QueryCriteria<TModel> {
  /**
   * COMPACT FIRST, then parse: the parser reads a branch's schema `default`
   * only when the key is ABSENT, and a third header click leaves an empty array
   * behind. Compacting with `preserveContainers: false` strips it, so the parse
   * refills the default.
   */
  function parse(values?: Partial<TModel>): TModel {
    return useModelParser<TModel>(
      schema,
      compactDeep(values, { preserveContainers: false }),
      {},
      { allowExtraProps: false, preserveContainers: false }
    );
  }

  /**
   * ajv's verdict on a REJECTED starting model. The seed is untrusted, so a
   * candidate that does not validate is discarded whole rather than partly
   * honoured — but discarding is not swallowing (FB5c), so its verdict is held
   * here and surfaced on `error` until the first `set` writes real intent.
   */
  const rejectedSeed = ref<ValidationErrorObject[]>([]);

  const intent = ref({}) as Ref<Partial<TModel>>;
  if (!isEmpty(seed)) {
    const errors = useValidation().validate(schema, parse(seed));
    if (isEmpty(errors)) intent.value = seed as Partial<TModel>;
    else rejectedSeed.value = errors;
  }

  const model = computed<TModel>(() => parse(intent.value));

  const error = computed<ResponseError | undefined>(() => {
    const errors = isEmpty(rejectedSeed.value)
      ? useValidation().validate(schema, model.value)
      : rejectedSeed.value;
    if (isEmpty(errors)) return undefined;

    return mapToHeadlessError(
      new DetailedError(
        useI18n().t("error.query_validation_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        errors
      )
    );
  });

  const props = computed<QueryProps>(() => translateQuery(schema, model.value));

  // The parse strips every inactive leaf, so a surviving `filters` branch IS a
  // column carrying a value — including `false`, which compaction keeps.
  const isFiltered = computed(() => !isEmpty(get(model.value, "filters")));

  /**
   * MERGES the given branches into the intent at BRANCH level: `set({ filters })`
   * replaces the whole `filters` branch — which is what "apply this filter set"
   * means — and leaves `sort` and `pagination` untouched, so a header filter
   * cannot silently clear a drawer filter and a rehydrated url cannot clear a
   * live sort. A FRESH object every call, so the model recomputes and
   * `useQuery`'s `isEqual` guard is a genuine value comparison.
   */
  function set(next: Partial<TModel>): void {
    rejectedSeed.value = [];
    intent.value = assign({}, intent.value, next);
  }

  return { model, schema, props, error, isFiltered, set };
}
