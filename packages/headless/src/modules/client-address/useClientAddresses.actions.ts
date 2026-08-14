import { ref, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import { set } from "lodash-es";
import type {
  ClientAddressListQuery,
  ClientAddressServices
} from "./client-address.types";
import type { RequestFilters } from "../query";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddresses.actions
 * @description Collection actions — row mutations, list controls and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * Per-address FORM mutations are not here — `input` / `update` / `clear`
 * belong to `useClientAddressManager`, which owns the dirty/valid state they
 * need. `ensure` IS here — a collection action, not a form one:
 * `basket-billing/unified` and `client-company`'s find-or-create never open a
 * form (ruling R4 retires `useClientAddressServices`, and this is where its
 * callers land).
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientAddresses.actions.{actor}.ts` file exists.
 */
export function createClientAddressesActions(
  _actorScope: ScopeActorTypes,
  service: ClientAddressServices,
  query: ClientAddressListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling.
   *
   * Reading `service.isAvailable` — the same predicate the query's `enabled`
   * and `guard` call — makes "ready to read" and "will ever fetch" the same
   * question, so readiness cannot wait on a fetch that is not coming. This is
   * what closes the pre-conversion `setInterval(…, 100)` (`useClientAddresses.ts`
   * L42-51): uncapped, never cleared on the never-fetched path, and with no
   * rejection path at all (`parity.yaml` L6 / AC-4).
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
    // rejecting, so a forced read has to be wrapped to reject at all.
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

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientAddresses.actions.{actor}.ts` and spread it LAST so it wins:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.STAFF
  //       ? createStaffClientAddressesActions(service)
  //       : {};
  // Never a `.base.ts` file; attach a `@decision` block adjacent to the spread
  // the day an arm overrides a shared member.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Finds an address by id, creating it only if absent. */
    ensure: service.ensure,

    /** Filters for the list query. */
    filters: {
      query: filterQuery
    },

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. */
    isReady,

    /**
     * Fetches the next page of addresses. Wrapped in an `async` function —
     * the query platform's `fetchNextPage` throws SYNCHRONOUSLY when there is
     * no next page, and an `async` wrapper is what turns that throw into a
     * rejected promise, so a forced call always SETTLES instead of escaping as
     * an uncaught exception (AC-9).
     */
    nextPage: async (): Promise<void> => query.fetchNextPage(),

    /** Fetches the previous page of addresses. Same `async` wrapper as `nextPage`. */
    prevPage: async (): Promise<void> => query.fetchPreviousPage(),

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /**
     * Deletes an address. Failure is REPORTED to the user by the module
     * itself (operator ruling R10) and captured as state — the returned
     * promise settles either way, and the consumer acquires no feedback
     * obligation (AC-14, AC-40).
     */
    remove: service.remove,

    /** Promotes an address to the client's default. Same feedback contract as `remove`. */
    setDefault: service.setDefault

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientAddressesActions = ReturnType<
  typeof createClientAddressesActions
>;
