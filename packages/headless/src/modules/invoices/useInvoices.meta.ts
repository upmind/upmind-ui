import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { InvoicesListQuery, InvoicesServices } from "./invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices.meta
 * @description Collection meta — computed state flags, one computed per
 * flag.
 * @doctrine clause 2 — shared-only (armless).
 */
export function createInvoicesMeta(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoicesListQuery,
  unpaidExistenceQuery: InvoicesListQuery,
  consolidatableCountQuery: InvoicesListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with
  // no own enumerable keys, which `isEmpty` reports as empty. Folds in the
  // auxiliary count queries' own errors (W1) — otherwise a 500 on
  // `unpaidExistenceQuery`/`consolidatableCountQuery` reports `hasUnpaid`/
  // `consolidatableCount` as a silent `false`/`0` with `hasError: false`.
  const hasError = computed(
    () =>
      !!service.error.value ||
      !!query.error.value ||
      !!unpaidExistenceQuery.error.value ||
      !!consolidatableCountQuery.error.value
  );

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total === 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  /**
   * AC10 — derives from the server's own total, never the row array.
   * Reading this is what flips the count query's request gate
   * (`invoices.services.ts`'s `requestUnpaidExistence`): an unread `hasUnpaid`
   * never issues AC10's dedicated count request.
   *
   * @decision
   * what: reads `unpaidExistenceQuery.pagination.value.total`, not the
   * handle's top-level `total.value`.
   * why: `ListQuery.total` (`query.types.ts`) is a computed over a `ref(0)`
   * that only self-updates from the response as a SIDE EFFECT of reading
   * `.pagination`/`.meta` (`useQuery.ts`'s `list()`); a dedicated count query
   * that reads only `.total` never triggers that update, so `.total.value`
   * stays at its initial `0` forever regardless of the server's answer.
   * `.pagination.value.total` reads the same ref but through the getter that
   * actually refreshes it from `response.data.value.total` — this module's
   * own `isEmptyList` above already reads the total this way. Not a query-
   * module change (operator ruling 2026-09-08): both fields already exist on
   * every `ListQuery`; this only picks the one that resolves.
   * rejected: fixing `ListQuery.total` in `query.types.ts`/`useQuery.ts` so a
   * bare `.total` read resolves without a `.pagination`/`.meta` read first —
   * the query-core fix the 2026-09-08 ruling withdraws.
   */
  const hasUnpaid = computed(() => {
    service.requestUnpaidExistence();
    return unpaidExistenceQuery.pagination.value.total > 0;
  });

  /**
   * AC2 — the notice/CTA count of invoices this client could consolidate,
   * from a DEDICATED query (`invoices.services.ts`'s `loadConsolidatableCount`)
   * that owns its own criteria object — reading this can never mutate the
   * list `useActions().filterConsolidatable()` narrows, and the two coexist.
   * Reading this is what flips the count query's request gate
   * (`requestConsolidatableCount`): an unread `consolidatableCount` never
   * issues AC2's dedicated count request.
   *
   * Reads `.pagination.value.total`, not the handle's top-level `total.value`
   * — same defect, same fix, same `@decision` as `hasUnpaid` above.
   */
  const consolidatableCount = computed(() => {
    service.requestConsolidatableCount();
    return consolidatableCountQuery.pagination.value.total;
  });

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useInvoices.meta.{actor}.ts` and spread it LAST.

  return {
    /** AC2 — the consolidatable-notice count, from its own dedicated read. */
    consolidatableCount,

    /**
     * True if the list query, the unpaid-existence read, or the
     * consolidatable-count read failed.
     */
    hasError,

    /** True while a page follows the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while the list spans more than one page. */
    hasPages: computed(() => query.meta.value.hasPages),

    /** True while a page comes before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /** AC10 — true if this scope has anything unpaid, by server count. */
    hasUnpaid,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gates call, not a second
     * copy of it.
     */
    isAvailable: service.isAvailable,

    /** True if this scope has no invoices. */
    isEmpty: isEmptyList,

    /** True when the published criteria carries any non-nil filter value. */
    isFiltered: query.isFiltered,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseInvoicesMeta = ReturnType<typeof createInvoicesMeta>;
