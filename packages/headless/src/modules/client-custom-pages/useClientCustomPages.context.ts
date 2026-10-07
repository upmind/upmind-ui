import { computed } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./client-custom-pages.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  CustomPage,
  CustomPagesListQuery
} from "./client-custom-pages.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPages.context
 * @description Collection context — the reactive page of custom pages and
 * its lookups. Query-backed: data is mapped in
 * `client-custom-pages.services.ts` via `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * `findOne`/`getOne` are where O9/O10/O11 land (AC4): a slug already on the
 * list resolves from it with no request — the single-read door is the
 * fallback, not the first stop.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCustomPagesContext(
  _actorScope: ScopeActorTypes,
  query: CustomPagesListQuery
) {
  const { findOne, getOne } = useCollection<CustomPage>(query.data);

  const data = computed<CustomPage[]>(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientCustomPages.context.{actor}.ts` and spread it
  // LAST.

  return {
    /** The reactive page of the brand's custom pages (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds one page on the page by a partial mapping — the slug lookup (AC4). */
    findOne,

    /** Finds one page on the page by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — the query's own published criteria
     * model, not a copy of it; read-only, write through
     * `useActions().filters` / `.sort`.
     */
    query: query.criteria,

    /**
     * The module's schema family, plain JSON so it survives the renderer
     * port's `JSON` round-trip. The renderer's only door to it is
     * `useContext()` — per ADR-032's 2026-08-18 amendment, the sort
     * uischema is published beside the query schema and its filter
     * uischema, not left as an unreachable export (B2).
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
export type UseClientCustomPagesContext = ReturnType<
  typeof createClientCustomPagesContext
>;
