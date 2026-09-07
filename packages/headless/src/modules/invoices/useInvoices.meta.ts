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
  unpaidExistenceQuery: InvoicesListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with
  // no own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total === 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  /** AC10 — derives from the server's own total, never the row array. */
  const hasUnpaid = computed(() => unpaidExistenceQuery.total.value > 0);

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useInvoices.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the list query, or the unpaid-existence read, failed. */
    hasError,

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
