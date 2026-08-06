import { ref, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import { set } from "lodash-es";
import type {
  ClientEmailListQuery,
  ClientEmailServices
} from "./client-email.types";
import type { RequestFilters } from "../query";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.actions
 * @description Collection actions — row mutations, list controls and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * Per-email FORM mutations are not here — `add` / `update` / `validate` belong
 * to `useClientEmailManager`, which owns the dirty/valid state they need.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns ONLY
 * shared members; no `useClientEmails.actions.{actor}.ts` file exists.
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
   * Gating on `isAuthenticated` alone is not enough: the list query is enabled
   * on the FULL addressability predicate, so a session that authenticates
   * without ever resolving a client id leaves the query permanently disabled,
   * and a readiness wait on its first fetch would never settle. Reading
   * `service.isAvailable` — the same predicate the query's `enabled` and
   * `guard` call — makes "ready to read" and "will ever fetch" the same
   * question, so readiness cannot wait on a fetch that is not coming.
   *
   * Initialised WITHOUT an addressable client is terminal (the guest floor, or
   * a session whose `/self` yielded no client); having stopped settling
   * WITHOUT initialising is a boot whose session mint failed. Both are terminal
   * — which is why readiness reads the store's own outcome rather than awaiting
   * the session's `isReady()`: that resolves only on INITIALISED, so a failed
   * boot leaves it pending forever.
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
   * Resolves once the collection is ready to read.
   *
   * The session gate is load-bearing: the list query is disabled until this
   * scope can address a client, so a bare `refetch()` would resolve without
   * fetching and report ready over an empty list.
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
    // that died between the two. The pre-check reads the services instance's
    // OWN addressability predicate — the one the list `guard` calls — so it
    // cannot drift from the gate it is standing in for.
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  // --- filters
  const filters = ref<RequestFilters & { query?: string }>({});

  /** Applies a free-text filter and re-issues the list request. */
  function filterQuery(value?: string): void {
    set(filters.value, "query", value);
    query.filter(filters.value);
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.as()` mints a fresh collection.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, add `useClientEmails.actions.{actor}.ts`
  // and spread it LAST so it wins:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.STAFF
  //       ? createStaffClientEmailsActions(service)
  //       : {};
  // Never a `.base.ts` file; attach a `@decision` block adjacent to the spread
  // the day an arm overrides a shared member.

  return {
    /**
     * Destroys this scoped instance — removes it from the registry.
     * @scenario-include
     */
    destroy,

    /**
     * Finds an address by id or value, creating it only if absent.
     * @scenario-include
     */
    ensure: service.ensure,

    /**
     * Filters for the list query.
     * @scenario-exclude no-op free-text setter on this endpoint; the search box maps to filters.email.like (Task 39)
     */
    filters: {
      query: filterQuery
    },

    /**
     * Marks the shared cache key stale so the next read refetches.
     * @scenario-exclude internal cache-key invalidation, not a user-facing capability
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /**
     * Resolves true when the collection is ready to read.
     * @scenario-include
     */
    isReady,

    /**
     * Fetches the next page of addresses.
     * @scenario-include
     */
    nextPage: query.fetchNextPage,

    /**
     * Fetches the previous page of addresses.
     * @scenario-include
     */
    prevPage: query.fetchPreviousPage,

    /**
     * Refetches the list from the server; rejects if it cannot address one.
     * @scenario-include
     */
    refresh,

    /**
     * Deletes a deletable address.
     * @scenario-include
     */
    remove: service.remove,

    /**
     * Promotes a verified address to the client's default.
     * @scenario-include
     */
    setDefault: service.setDefault,

    /**
     * Resends the verification email for an address.
     * @scenario-include
     */
    verify: service.verify

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientEmailsActions = ReturnType<
  typeof createClientEmailsActions
>;
