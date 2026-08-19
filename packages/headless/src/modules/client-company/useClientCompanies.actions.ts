import { ref, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import { set } from "lodash-es";
import type {
  ClientCompanyListQuery,
  ClientCompanyServices
} from "./client-company.types";
import type { RequestFilters } from "../query";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanies.actions
 * @description Collection actions — row mutations, list controls and
 * lifecycle. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * Per-company FORM mutations are not here — `add` / `update` / `validate`
 * belong to `useClientCompanyManager`, which owns the dirty/valid state they
 * need. `ensure` IS here (`design.md` D6) — a collection action, not a form
 * one: `basket-billing/unified`'s find-or-create never opens a form.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientCompanies.actions.{actor}.ts` file exists.
 */
export function createClientCompaniesActions(
  _actorScope: ScopeActorTypes,
  service: ClientCompanyServices,
  query: ClientCompanyListQuery,
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
   * question, so readiness cannot wait on a fetch that is not coming (NFR-3:
   * this closes the pre-conversion `setInterval(…, 100)` that never cleared
   * when the query was gated, `useClientCompanies.ts` L42-56).
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
  // `useClientCompanies.actions.{actor}.ts` and spread it LAST so it wins:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.STAFF
  //       ? createStaffClientCompaniesActions(service)
  //       : {};
  // Never a `.base.ts` file; attach a `@decision` block adjacent to the spread
  // the day an arm overrides a shared member.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Finds a company by id, creating it only if absent. */
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
     * Fetches the next page of companies. Wrapped in an `async` function —
     * the query platform's `fetchNextPage` throws SYNCHRONOUSLY when there is
     * no next page (`useQuery.ts` — `(): void => { ... throw ... }`); an
     * `async` wrapper is what turns that throw into a rejected promise, so a
     * forced call always SETTLES instead of escaping as an uncaught
     * exception (AC-9, NFR-3).
     */
    nextPage: async (): Promise<void> => query.fetchNextPage(),

    /** Fetches the previous page of companies. Same `async` wrapper as `nextPage`. */
    prevPage: async (): Promise<void> => query.fetchPreviousPage(),

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /** Deletes a deletable company. */
    remove: service.remove,

    /** Promotes a company to the client's default. */
    setDefault: service.setDefault

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientCompaniesActions = ReturnType<
  typeof createClientCompaniesActions
>;
