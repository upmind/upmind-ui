import { computed } from "vue";
import { resolveClientId, useActiveSession } from "../session-store";
import { isEmpty } from "lodash-es";
import type {
  ContractProductListQuery,
  ContractProductsMetaMembers
} from "./contract-product.types";
import type { ScopeActorTypes, ScopeContext } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.meta
 * @description Collection meta: computed state flags, one computed per flag.
 */

export function createContractProductsMeta(
  _actorScope: ScopeActorTypes,
  scopeContext: ScopeContext | undefined,
  query: ContractProductListQuery
): ContractProductsMetaMembers {
  const session = useActiveSession().useMeta();
  const clientId = resolveClientId(scopeContext);

  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with no
  // own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(
    () => !!query.error.value || !!query.criteriaError.value
  );

  const hasPages = computed(() => query.meta.value.hasPages);

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isAvailable = computed(
    () => session.isAuthenticated.value && !!clientId.value
  );

  // The same settled-unaddressable outcome `isReady()` resolves false on: the
  // guard refuses, no read is sent, so nothing is loading.
  const isLoading = computed(() => {
    const isRefused =
      !isAvailable.value &&
      (session.isAvailable.value || !session.isLoading.value);

    return !isRefused && (query.isLoading.value || !query.isFetched.value);
  });

  return {
    /** True if the list query failed, criteria errors included. */
    hasError,

    /** True while pagination applies to this list at all. */
    hasPages,

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
