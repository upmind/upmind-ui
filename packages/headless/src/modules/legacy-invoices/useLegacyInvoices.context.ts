import { computed } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./legacy-invoices.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  LegacyInvoice,
  LegacyInvoicesListQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoices.context
 * @description Collection context — the reactive list. Query-backed: data is
 * mapped in `legacy-invoices.services.ts` via `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 *
 * @decision
 * what: this factory takes no `baseLookups` parameter and publishes no
 * `lookups` member (the query template's own worked-example member).
 * why: `baseLookups` exists to drive a `.for(entity, id)` scope picker over
 * the collection's own retarget contexts. This module mints no context enum
 * at all (ruling OD1) — the archive hangs off no parent entity — so there is
 * no relationship to look up and no picker for a lookup service to drive.
 * rejected: a `lookups` member with no context to resolve against — an
 * unearned member with nothing to serve.
 */
export function createLegacyInvoicesContext(
  _actorScope: ScopeActorTypes,
  service: LegacyInvoicesServices,
  query: LegacyInvoicesListQuery
) {
  const { findOne, getOne } = useCollection<LegacyInvoice>(query.data);

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  const data = computed(() =>
    isArray(query.data.value) ? query.data.value : []
  );

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useLegacyInvoices.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive list of this scope's imported invoices (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single record by a partial mapping. */
    findOne,

    /** Finds a single record by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — the query's own published criteria
     * model, not a copy of it; read-only, write through
     * `useActions().setCriteria`.
     */
    query: query.criteria,

    /** The server's row total for this scope's published list criteria. */
    total: computed(() => query.pagination.value.total),

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
export type UseLegacyInvoicesContext = ReturnType<
  typeof createLegacyInvoicesContext
>;
