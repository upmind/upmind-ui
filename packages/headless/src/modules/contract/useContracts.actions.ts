import { watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type { ContractServices, ContractListQuery } from "./contract.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContracts.actions
 * @description Collection actions — paging and lifecycle. Query-backed:
 * `destroy()` removes the registry entry, because there is no service to stop.
 * The contract writes belong to `useContract`, which owns the machine they
 * run through.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns ONLY
 * shared members; no `useContracts.actions.{actor}.ts` file exists.
 */
export function createContractsActions(
  _actorScope: ScopeActorTypes,
  service: ContractServices,
  query: ContractListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
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
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /** Destroys this scoped instance — removes it from the registry. */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  return {
    /**
     * @scenario-include
     */
    destroy,

    /**
     * @scenario-exclude internal cache-key invalidation, not a user-facing capability
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /**
     * @scenario-include
     */
    isReady,

    /**
     * @scenario-include
     */
    nextPage: query.fetchNextPage,

    /**
     * @scenario-include
     */
    prevPage: query.fetchPreviousPage,

    /**
     * @scenario-include
     */
    refresh,

    /**
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /**
     * Merges a `pagination` intent into the ONE query model — the door that
     * sets the page size: `setCriteria({ pagination: { limit } })`.
     * @scenario-include
     */
    setCriteria: query.setCriteria
  };
}

export type UseContractsActions = ReturnType<typeof createContractsActions>;
