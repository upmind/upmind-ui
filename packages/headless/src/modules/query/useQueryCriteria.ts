import { computed, ref } from "vue";
import { useI18n } from "../system-localisation";
import { translateQuery } from "./query.utils";
import {
  compactDeep,
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { assign, get, has, isEmpty } from "lodash-es";
import type {
  QueryCriteria,
  QueryCriteriaOptions,
  QueryProps,
  ValidationErrorObject
} from "./query.types";
import type { ResponseError } from "../../utils";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module query/useQueryCriteria
 * @description A collection's REQUEST STATE as a schema-governed model, in one
 * place: intent → parse → validate → translate. It takes ONE input — the
 * declared `{ schema, model? }` pair — and knows nothing about fetching, urls,
 * vue-query or scope, so it can be exercised with no HTTP at all.
 *
 * `list()` and `listInfinite()` construct it from `options.criteria`, so a
 * module declares a schema and passes it and cannot wire the pipeline wrongly.
 */
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
  // Compact BEFORE parsing: the parser reads a branch's schema `default` only
  // when the key is absent, and a cleared branch leaves an empty container.
  function parse(values?: Partial<TModel>): TModel {
    return useModelParser<TModel>(
      schema,
      compactDeep(values, { preserveContainers: false }),
      {},
      { allowExtraProps: false, preserveContainers: false }
    );
  }

  /** ajv's verdict on the last REJECTED write, held until a valid one replaces it. */
  const rejected = ref<ValidationErrorObject[]>([]);

  const intent = ref({}) as Ref<Partial<TModel>>;

  /**
   * The ONE gate every write passes — the seed and every `set` alike. ajv reads
   * the PARSED candidate, so a committed model is valid by construction; a
   * candidate is committed WHOLE or not at all.
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

  const isFiltered = computed(() => !isEmpty(get(model.value, "filters")));

  /**
   * MERGES the given branches into the intent at BRANCH level — `set({ filters })`
   * replaces the whole `filters` branch and leaves `sort` and `pagination`
   * standing. A FRESH object every call, so the model recomputes.
   *
   * A write that changes the RESULT SET without declaring its own window
   * returns `pagination.offset` to the first page: page SIZE survives, page
   * POSITION does not. A write that carries `pagination` is honoured as given.
   *
   * The merged candidate is offered to {@link commit}, never assigned — an
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
