import { watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientEmailListQuery,
  ClientEmailServices,
  FilterModel,
  SortModel
} from "./client-email.types";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.actions
 * @description Collection actions — row mutations, list controls and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * Per-email FORM mutations are not here — `add` / `update` / `validate` belong
 * to `useClientEmailManager`, which owns the dirty/valid state they need.
 */
export function createClientEmailsActions(
  _actorScope: ScopeActorTypes,
  service: ClientEmailServices,
  query: ClientEmailListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling.
   *
   * Reads `service.isAvailable` — the same predicate the query's `enabled` and
   * `guard` call — so "ready to read" and "will ever fetch" stay one question
   * and readiness cannot wait on a fetch that is not coming. Initialised
   * WITHOUT an addressable client, and having stopped settling without
   * initialising, are both terminal outcomes; the session's own `isReady()`
   * resolves only on INITIALISED, so a failed boot would leave it pending.
   */
  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  /**
   * Resolves the addressability outcome, waiting only while the session is
   * still settling.
   */
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

  /** Resolves once the list query has completed its first fetch. */
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
   * Resolves once the collection is ready to read. The session gate is
   * load-bearing: the list query is disabled until this scope can address a
   * client, so a bare `refetch()` would resolve without fetching and report
   * ready over an empty list.
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
    // TanStack's `refetch()` resolves with the error on the result rather than
    // rejecting, so a forced read has to be wrapped to reject at all: the
    // pre-check leaves the request unfired, the result check catches a session
    // that died between the two.
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Applies a filter INTENT — the `filters` branch of the one query model, so
   * `sort` and `pagination` are untouched by construction. The free-text search
   * binds `filters.email.like`.
   */
  function filterBy(intent: FilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /**
   * Applies a sort INTENT — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched. A `[]` intent is compacted away
   * and the parse refills the schema's `default` order, so clearing the sort
   * lands as the default rather than an absent order.
   */
  function sortBy(intent: SortModel): void {
    query.setCriteria({ sort: intent });
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.as()` mints a fresh collection.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  return {
    /**
     * @scenario-include
     */
    destroy,

    /**
     * @scenario-include
     */
    ensure: service.ensure,

    /**
     * @scenario-include
     */
    filterBy,

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
     * @scenario-include
     */
    remove: service.remove,

    /**
     * @scenario-include
     */
    setDefault: service.setDefault,

    /**
     * @scenario-include
     */
    sortBy,

    /**
     * @scenario-include
     */
    verify: service.verify
  };
}

export type UseClientEmailsActions = ReturnType<
  typeof createClientEmailsActions
>;
