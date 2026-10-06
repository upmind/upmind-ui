import { computed } from "vue";
import { useActiveSession } from "../session-store";
import { isEmpty } from "lodash-es";
import type { ContractProductListQuery } from "./contract-product.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.meta
 * @description Collection meta — computed state flags, one computed per flag.
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractProductsMeta(
  _actorScope: ScopeActorTypes,
  clientId: ComputedRef<string | undefined>,
  query: ContractProductListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with no
  // own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(
    () => !!query.error.value || !!query.criteriaError.value
  );

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const {
    isAuthenticated,
    isAvailable: isSessionInitialised,
    isLoading: isSessionSettling
  } = useActiveSession().useMeta();

  const isAvailable = computed(() => isAuthenticated.value && !!clientId.value);

  // The same settled-unaddressable outcome `isReady()` resolves false on: the
  // guard refuses, no read is sent, so nothing is loading.
  const isRefused = computed(
    () =>
      !isAvailable.value &&
      (isSessionInitialised.value || !isSessionSettling.value)
  );

  const isLoading = computed(
    () => !isRefused.value && (query.isLoading.value || !query.isFetched.value)
  );

  return {
    /** True if the list query failed, criteria errors included. */
    hasError,

    /** True while pagination applies to this list at all. */
    hasPages: computed(() => query.meta.value.hasPages),

    /** True while this scope can address a client — the predicate the request gates call. */
    isAvailable,

    /** True if the collection has no items. */
    isEmpty: isEmptyList,

    /** True while ANY filter is applied. */
    isFiltered: query.isFiltered,

    /** True while the list is loading or has not completed its first fetch; false once the session settles unaddressable. */
    isLoading
  };
}

export type UseContractProductsMeta = ReturnType<
  typeof createContractProductsMeta
>;
