import { until } from "@vueuse/core";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { resolveClientId, useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ContractProductGroupedCountsQuery,
  ContractProductListQuery,
  ContractProductsActionMembers,
  ContractProductsServices,
  FilterModel,
  SortModel
} from "./contract-product.types";
import type { ScopeActorTypes, ScopeContext } from "../scope/scope.types";
import type { ICProdGroup } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.actions
 * @description Collection actions: list controls, the two extra reads and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no machine to stop.
 */

export function createContractProductsActions(
  _actorScope: ScopeActorTypes,
  service: ContractProductsServices,
  query: ContractProductListQuery,
  groupedCounts: ContractProductGroupedCountsQuery,
  scopeKey: string,
  scopeContext?: ScopeContext
): ContractProductsActionMembers {
  const {
    isAuthenticated,
    isAvailable: isSessionInitialised,
    isLoading: isSessionSettling
  } = useActiveSession().useMeta();
  const clientId = resolveClientId(scopeContext);

  /**
   * Resolves once the collection is ready to read. The session gate is
   * load-bearing: the list query is disabled until this scope can address a
   * client.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client.
   */
  async function isReady(): Promise<boolean> {
    await until(
      () =>
        (isAuthenticated.value && !!clientId.value) ||
        isSessionInitialised.value ||
        !isSessionSettling.value
    ).toBe(true);
    if (!isAuthenticated.value || !clientId.value) return false;

    await until(query.isFetched).toBe(true);
    return true;
  }

  /**
   * Forces a re-read of the list from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    // TanStack's `refetch()` resolves with the error on the result rather than
    // rejecting, so a forced read checks the session and the result itself.
    if (!isAuthenticated.value || !clientId.value)
      throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /** Applies a filter intent: the `filters` branch of the one query model. */
  function filterBy(intent: FilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /** Applies a sort intent: the `sort` branch of the one query model. */
  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  /**
   * Reads the dashboard's grouped counts, and publishes them on
   * `useContext().groupedCounts`.
   */
  async function loadGroupedCounts(): Promise<ICProdGroup[]> {
    const { data, error } = await groupedCounts.refetch();
    if (error) throw error;
    return data ?? [];
  }

  /** Destroys this scoped instance — removes it from the registry. */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  return {
    /** @scenario-include */
    destroy,

    /** @scenario-include */
    filterBy,

    /**
     * @scenario-exclude internal cache-key invalidation, not a user-facing capability
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** @scenario-include */
    isReady,

    /** @scenario-include */
    loadGroupedCounts,

    /**
     * The categories the client has purchased into.
     * @scenario-include
     */
    loadPurchasedCategories: service.loadPurchasedCategories,

    /** @scenario-include */
    nextPage: query.fetchNextPage,

    /** @scenario-include */
    prevPage: query.fetchPreviousPage,

    /** @scenario-include */
    refresh,

    /**
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /**
     * Merges `filters` / `sort` / `pagination` into the one query model; the door that sets the page size.
     * @scenario-include
     */
    setCriteria: query.setCriteria,

    /** @scenario-include */
    sortBy
  };
}

export type UseContractProductsActions = ReturnType<
  typeof createContractProductsActions
>;
