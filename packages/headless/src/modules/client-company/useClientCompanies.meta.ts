import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientCompanyListQuery,
  ClientCompanyServices
} from "./client-company.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanies.meta
 * @description Collection meta — computed state flags, one computed per
 * flag. `hasError` and `isAvailable` deliberately spell out the same
 * doctrine `client-email-history` records: an `Error` instance has no own
 * enumerable keys, so `isEmpty` reports it as EMPTY, and the flag a consumer
 * renders must be the SAME ref the query's `enabled`/`guard` call, not a
 * second copy of the expression (`parity.yaml` C5, C8).
 * @doctrine clause 2 — shared-only (armless). No capability read-state exists
 * in this module's single cell, so `meta` legitimately stays shared-only.
 */
export function createClientCompaniesMeta(
  _actorScope: ScopeActorTypes,
  service: ClientCompanyServices,
  query: ClientCompanyListQuery
) {
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total == 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientCompanies.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if a row mutation or the list query failed. */
    hasError,

    /** True while the query has a further page after the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while pagination applies to this list at all. */
    hasPages: computed(() => query.meta.value.hasPages),

    /** True while the query has a page before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gates call, not a second
     * copy of it (AC-5).
     */
    isAvailable: service.isAvailable,

    /** True if this scope has no companies. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientCompaniesMeta = ReturnType<
  typeof createClientCompaniesMeta
>;
