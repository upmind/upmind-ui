import { computed } from "vue";
import {
  useLookupsSchema,
  useLookupsUischema,
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./invoices.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type {
  Invoice,
  InvoicesScopeLookups,
  InvoicesListQuery,
  InvoicesServices
} from "./invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices.context
 * @description Collection context — the reactive list and its lookup
 * helpers. Query-backed: data is mapped in `invoices.services.ts` via
 * `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createInvoicesContext(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoicesListQuery,
  lookups: InvoicesScopeLookups
) {
  const { findOne, getOne } = useCollection<Invoice>(query.data);

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
  // earns one, add `useInvoices.context.{actor}.ts` and spread it LAST.

  return {
    /** The relationship lookups a scope picker drives, one per context type. */
    lookups,
    /** The reactive list of this scope's invoices (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single invoice by a partial mapping. */
    findOne,

    /** Finds a single invoice by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — the query's own published criteria
     * model, not a copy of it; read-only, write through
     * `useActions().setCriteria`.
     */
    query: query.criteria,

    /**
     * The server's row total for this scope's published list criteria —
     * NOT the consolidation-notice count (that's `useMeta().
     * consolidatableCount`, over its own dedicated query).
     *
     * @decision
     * what: reads `query.pagination.value.total`, not the handle's
     * top-level `total.value`.
     * why: identical defect and fix to `useInvoices.meta.ts`'s `hasUnpaid`
     * `@decision` — `ListQuery.total` is a computed over a `ref(0)` that
     * only self-updates as a side effect of reading `.pagination`/`.meta`;
     * a consumer reading only this member would see `0` forever regardless
     * of the server's answer. Not a query-module change (operator ruling
     * 2026-09-08): both fields already exist on every `ListQuery`; this
     * only picks the one that resolves.
     * rejected: fixing `ListQuery.total` in `query.types.ts`/`useQuery.ts`
     * — the query-core fix the 2026-09-08 ruling withdraws.
     */
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
      },
      /**
       * The `.for()` picker's lookups pair, each control already bound to
       * this scope's lookup. A picker renders it and reaches no service.
       */
      lookups: {
        schema: useLookupsSchema(),
        uischema: useLookupsUischema(lookups)
      }
    }

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseInvoicesContext = ReturnType<typeof createInvoicesContext>;
