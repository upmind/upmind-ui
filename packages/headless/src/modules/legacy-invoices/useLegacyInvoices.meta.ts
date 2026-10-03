import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  LegacyInvoiceAvailabilityQuery,
  LegacyInvoicesListQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoices.meta
 * @description Collection meta — computed state flags, one computed per
 * flag. Ruling OD3/OD6 — the collection publishes `isLoading` and no
 * `isComplete` (the manager-only member) and no `isReloading` (dropped —
 * `isLoading` covers the same ground).
 * @doctrine clause 2 — shared-only (armless).
 */
export function createLegacyInvoicesMeta(
  _actorScope: ScopeActorTypes,
  service: LegacyInvoicesServices,
  query: LegacyInvoicesListQuery,
  availability: LegacyInvoiceAvailabilityQuery
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

  /**
   * AC5 — the availability condition, read from the module's OWN client read
   * (`service.loadAvailability()`), which requests the `legacy_invoices`
   * relation so the API computes `has_legacy_invoices`. The `/self` include
   * the session store issues does not request it, so `activeUser` reports a
   * false negative for a client who owns imported invoices. `=== true` floors
   * the pre-fetch default to `false` (the query's unfetched `data` is `[]`).
   */
  const hasLegacyInvoices = computed(() => availability.data.value === true);

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useLegacyInvoices.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the list query failed. */
    hasError,

    /** AC5 — true if the signed-in client's record carries the availability condition. */
    hasLegacyInvoices,

    /** True while pagination applies to this list at all. */
    hasPages: computed(() => query.meta.value.hasPages),

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gate calls, not a second
     * copy of it.
     */
    isAvailable: service.isAvailable,

    /** True if this scope's archive holds no rows. */
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
export type UseLegacyInvoicesMeta = ReturnType<typeof createLegacyInvoicesMeta>;
