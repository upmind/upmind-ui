import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { ContractServices, ContractListQuery } from "./contract.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContracts.meta
 * @description Collection meta — computed state flags, one computed per flag.
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractsMeta(
  _actorScope: ScopeActorTypes,
  service: ContractServices,
  query: ContractListQuery
) {
  const hasError = computed(
    () => !!query.error.value || !!query.criteriaError.value
  );

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  return {
    /** True if the list query failed, criteria errors included. */
    hasError,

    /** True while the query has a further page after the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while pagination applies to this list at all. */
    hasPages: computed(() => query.meta.value.hasPages),

    /** True while the query has a page before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /** True while this scope can address a client — the predicate the request gates call. */
    isAvailable: service.isAvailable,

    /** True if this scope has no contracts. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading
  };
}

export type UseContractsMeta = ReturnType<typeof createContractsMeta>;
