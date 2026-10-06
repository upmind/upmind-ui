import { watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ContractProductListQuery,
  ContractProductServices,
  FilterModel,
  ShowDelegatedPreference,
  SortModel
} from "./contract-product.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ICProdGroup } from "@upmind-automation/types";
import type { ComputedRef, Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.actions
 * @description Collection actions — list controls, the two extra reads and
 * lifecycle. Query-backed: `destroy()` removes the registry entry and stops
 * the scoped preference reader; there is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createContractProductsActions(
  _actorScope: ScopeActorTypes,
  service: ContractProductServices,
  query: ContractProductListQuery,
  scopeKey: string,
  groupedCounts: Ref<ICProdGroup[]>,
  clientId: ComputedRef<string | undefined>,
  preference: ShowDelegatedPreference
) {
  const {
    isAuthenticated,
    isAvailable: isSessionInitialised,
    isLoading: isSessionSettling
  } = useActiveSession().useMeta();

  /**
   * This scope's settled addressability outcome, or `undefined` while the
   * session is still settling. The same check the query's `enabled` and
   * `guard` make, so "ready to read" and "will ever fetch" are the same question.
   */
  function addressableOutcome(): boolean | undefined {
    if (isAuthenticated.value && clientId.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [isAuthenticated, clientId, isSessionInitialised, isSessionSettling],
        () => {
          const outcome = addressableOutcome();
          if (outcome === undefined) return;
          stop();
          resolve(outcome);
        }
      );
    });
  }

  function whenListFetched(): Promise<boolean> {
    if (query.isFetched.value) return Promise.resolve(true);

    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenListFetched();
  }

  /**
   * Forces a re-read of the list from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    // TanStack's `refetch()` resolves with the error on the result rather
    // than rejecting, so a forced read has to be wrapped to reject at all.
    if (!isAuthenticated.value || !clientId.value)
      throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  function filterBy(intent: FilterModel): void {
    query.setCriteria({ filters: intent });
  }

  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  function destroy(): void {
    preference.destroy();
    removeFromRegistry(scopeKey);
  }

  /**
   * Reads the dashboard's grouped counts and publishes them on
   * `useContext().groupedCounts` (G1), so a page has a reactive channel and
   * not only a promise to await.
   */
  async function loadGroupedCounts(): Promise<ICProdGroup[]> {
    const groups = await service.loadGroupedCounts();
    groupedCounts.value = groups;
    return groups;
  }

  // --- actor-specific actions: none earned (clause 2, design 8.8).

  return {
    /**
     * Destroys this scoped instance — deregisters it and stops the preference reader.
     * @scenario-include
     */
    destroy,

    /**
     * Applies a filter intent — the `filters` branch of the one query model.
     * @scenario-include
     */
    filterBy,

    /**
     * @scenario-exclude internal cache-key invalidation, not a user-facing capability
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /**
     * Resolves once the collection is ready to read.
     * @scenario-include
     */
    isReady,

    /**
     * The dashboard's grouped counts (design 8.1); publishes them on
     * `useContext().groupedCounts` (G1).
     * @scenario-include
     */
    loadGroupedCounts,

    /**
     * The categories the client has purchased into (R10).
     * @scenario-include
     */
    loadPurchasedCategories: service.loadPurchasedCategories,

    /**
     * Fetches the next page.
     * @scenario-include
     */
    nextPage: query.fetchNextPage,

    /**
     * Fetches the previous page.
     * @scenario-include
     */
    prevPage: query.fetchPreviousPage,

    /**
     * Forces a re-read of the list.
     * @scenario-include
     */
    refresh,

    /**
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /**
     * Merges `filters` / `sort` / `pagination` into the one query model — the door that sets the page size.
     * @scenario-include
     */
    setCriteria: query.setCriteria,

    /**
     * Applies a sort intent — the `sort` branch of the one query model.
     * @scenario-include
     */
    sortBy
  };
}

export type UseContractProductsActions = ReturnType<
  typeof createContractProductsActions
>;
