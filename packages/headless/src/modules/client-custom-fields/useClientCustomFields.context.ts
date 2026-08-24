import { computed } from "vue";
import { resolveFieldByValue } from "./client-custom-fields.mappers";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./client-custom-fields.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray, isEmpty, isMatch, filter as filterBy } from "lodash-es";
import type {
  ClientCustomFieldsListQuery,
  ClientCustomFieldsServices,
  CustomField
} from "./client-custom-fields.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ICustomFieldValue } from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFields.context
 * @description Collection context — the reactive list and its lookup
 * helpers. Definitions are mapped in `client-custom-fields.services.ts` via
 * `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure —
 * the last rejected mutation, else the list query's own — exposed for the
 * consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCustomFieldsContext(
  _actorScope: ScopeActorTypes,
  service: ClientCustomFieldsServices,
  query: ClientCustomFieldsListQuery,
  narrowing: Ref<Partial<CustomField> | Partial<CustomField>[]>
) {
  const { findOne, getOne } = useCollection<CustomField>(query.data);

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  const loaded = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  /**
   * The client-SIDE narrowed view (AC-8) — a partial-match predicate (or, per
   * ruling R3, an ARRAY of them, every one of which must match — legacy's own
   * `_.map(this.filters, filter => …)`, `customFields.vue:204-215`) over the
   * ALREADY-LOADED list, never a new request.
   */
  const data = computed(() => {
    if (isEmpty(narrowing.value)) return loaded.value;
    const filters = isArray(narrowing.value)
      ? narrowing.value
      : [narrowing.value];
    return filterBy(loaded.value, item =>
      filters.every(filter => isMatch(item, filter))
    );
  });

  const error = computed<ResponseError | undefined>(
    () =>
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  /**
   * Resolves a value's definition, preferring the EMBEDDED `value.field`
   * (seam A-8, AC-16) so THIS collection never needs to be loaded to
   * resolve a value the caller already holds.
   */
  function resolveField(value?: ICustomFieldValue): CustomField | undefined {
    return resolveFieldByValue(value, loaded.value);
  }

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientCustomFields.context.{actor}.ts` and spread it
  // LAST.

  return {
    /** The reactive list of this scope's brand's definitions (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single definition by a partial mapping. */
    findOne,

    /** Finds a single definition by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /** The live criteria model — filters · sort · pagination, one source. */
    query: query.criteria,

    /** Resolves a value's definition, preferring the embedded one (A-8). */
    resolveFieldByValue: resolveField,

    /**
     * The module's schema family, plain JSON so it survives the renderer
     * port's `JSON` round-trip. The renderer's only door to it is
     * `useContext()`.
     */
    schemas: {
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(),
        sortUischema: useSortUischema()
      }
    }

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientCustomFieldsContext = ReturnType<
  typeof createClientCustomFieldsContext
>;
