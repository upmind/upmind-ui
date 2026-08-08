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
  has,
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
 * comparison.
 */
export function translateQuery(
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
   * ajv's verdict on the last REJECTED write, held until a valid one replaces
   * it. Discarding is not swallowing (FB5c): the rejection is what `error`
   * publishes, so the surface can say WHY the criteria did not move.
   */
  const rejected = ref<ValidationErrorObject[]>([]);

  const intent = ref({}) as Ref<Partial<TModel>>;

  /**
   * The ONE gate every write passes — the seed and every `set` alike. ajv reads
   * the PARSED candidate, which is the exact document `model` would publish, so
   * a clean verdict here means the committed criteria is valid by construction:
   * `props` can never translate a model ajv has already rejected onto the wire,
   * and a rejected write cannot destroy the sort, filters or page the user
   * already has. A candidate is committed WHOLE or not at all — its valid
   * branches go with its invalid one, because half a request state is a list
   * that lies about what it is showing.
   */
  function commit(candidate: Partial<TModel>): void {
    rejected.value = useValidation().validate(schema, parse(candidate));
    if (isEmpty(rejected.value)) intent.value = candidate;
  }

  if (!isEmpty(seed)) commit(seed as Partial<TModel>);

  const model = computed<TModel>(() => parse(intent.value));

  const error = computed<ResponseError | undefined>(() => {
    if (isEmpty(rejected.value)) return undefined;

    return mapToHeadlessError(
      new DetailedError(
        useI18n().t("error.query_validation_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        rejected.value
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
   *
   * ONE exception, and it is the cursor's whole law: a write that changes the
   * RESULT SET without declaring its own window returns `pagination.offset` to
   * the first page — page SIZE survives, page POSITION does not, because page 4
   * of the old filter set is not page 4 of the new one. A write that DOES carry
   * `pagination` — paging, a page-size change, a rehydrated url — is honoured
   * exactly as given, and a schema with no `pagination` branch has no cursor to
   * return.
   *
   * The merged candidate is offered to {@link commit}, never assigned: an
   * invalid write leaves the live criteria standing and surfaces on `error`.
   */
  function set(next: Partial<TModel>): void {
    const cursor =
      isEmpty(next) ||
      has(next, "pagination") ||
      !has(model.value, "pagination")
        ? {}
        : {
            pagination: assign({}, get(intent.value, "pagination"), {
              offset: 0
            })
          };
    commit(assign({}, intent.value, next, cursor) as Partial<TModel>);
  }

  return { model, schema, props, error, isFiltered, set };
}
