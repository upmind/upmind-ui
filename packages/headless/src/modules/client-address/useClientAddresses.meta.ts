import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientAddressListQuery,
  ClientAddressServices
} from "./client-address.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddresses.meta
 * @description Collection meta — computed state flags, one computed per flag.
 * `isAvailable` is handed straight through from the services instance: it IS
 * the predicate the query's `enabled`/`guard` call, not a second copy of the
 * expression, so the flag a consumer renders and the gate the wire enforces
 * cannot drift apart.
 * @doctrine clause 2 — shared-only (armless). Legacy's four address
 * permissions are staff-only (`parity.yaml` D3-D6) and `can()` returns true
 * unconditionally outside admin context, so this cell has NO capability
 * read-state for a `meta` arm to hold.
 */
export function createClientAddressesMeta(
  _actorScope: ScopeActorTypes,
  service: ClientAddressServices,
  query: ClientAddressListQuery
) {
  const hasError = computed(
    () =>
      !!service.error.value ||
      !!query.error.value ||
      !!query.criteriaError.value
  );

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total == 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientAddresses.meta.{actor}.ts` and spread it LAST.

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
     * resolved client id.
     */
    isAvailable: service.isAvailable,

    /** True if this scope has no addresses. */
    isEmpty: isEmptyList,

    /**
     * True while any declared filter column carries a value. Handed straight
     * through from the query's published criteria — so an empty list that is
     * empty BECAUSE it is filtered can say so, instead of both emptinesses
     * reading the same.
     */
    isFiltered: query.isFiltered,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientAddressesMeta = ReturnType<
  typeof createClientAddressesMeta
>;
