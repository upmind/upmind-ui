import { nextTick, watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientOrdersListQuery,
  ClientOrdersServices
} from "./client-orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrders.actions
 * @description Collection actions — readiness, paging (design 8.3), the P5b
 * zero-row recovery watch (D-6), and lifecycle. Query-backed: `destroy()`
 * removes the registry entry, because there is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientOrders.actions.{actor}.ts` file exists.
 */
export function createClientOrdersActions(
  _actorScope: ScopeActorTypes,
  service: ClientOrdersServices,
  query: ClientOrdersListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * A first fetch that never settles would otherwise leave `isReady()`
   * waiting forever. This bound is the fix: `isReady()` always SETTLES,
   * resolving `false` on exhaustion rather than hanging a caller's `await`.
   */
  const READY_TIMEOUT_MS = 10_000;

  function addressableOutcome(): boolean | undefined {
    const { isAuthenticated } = useActiveSession().useMeta();
    if (isAuthenticated.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch([isSessionInitialised, isSessionSettling], () => {
        const outcome = addressableOutcome();
        if (outcome === undefined) return;
        stop();
        resolve(outcome);
      });
    });
  }

  async function whenFetched(): Promise<boolean> {
    await nextTick();

    if (query.isFetched.value) return true;

    return new Promise<boolean>(resolve => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        stop();
        resolve(false);
      }, READY_TIMEOUT_MS);
      const stop = watch(query.isFetched, fetched => {
        if (!fetched || settled) return;
        settled = true;
        clearTimeout(timer);
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles with no addressable client, or once the fetch itself times out.
   * Always SETTLES.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /**
   * Forces a re-read of the list from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Design 8.3 pagination write rule — a page write replaces the WHOLE
   * `pagination` branch, so `limit` always rides along with `offset`.
   */
  function writePage(page: number): void {
    const limit = query.criteria.value.pagination?.limit ?? 10;
    query.setCriteria({
      pagination: { limit, offset: (Math.max(1, page) - 1) * limit }
    });
  }

  /** Advances the list one page forward. */
  function nextPage(): void {
    const { page = 1, pages = 1 } = query.pagination.value ?? {};
    writePage(Math.min(pages, page + 1));
  }

  /** Steps the list one page back. */
  function prevPage(): void {
    const { page = 1 } = query.pagination.value ?? {};
    writePage(Math.max(1, page - 1));
  }

  /** Jumps to the given page (design 8.3). */
  function setPage(page: number): void {
    writePage(page);
  }

  /** Sets the page size and returns to the first page (design 8.3). */
  function setLimit(limit: number): void {
    query.setCriteria({
      pagination: { limit: Math.max(1, limit), offset: 0 }
    });
  }

  /**
   * D-6 — the P5b watch: on a SETTLED read with no error, zero total rows
   * and a non-zero offset, writes offset 0 at the module edge. The core
   * does not recover on a zero total (ruling R4 bars the query-core change
   * this would otherwise be).
   */
  watch(
    () => [
      query.isFetched.value,
      !!query.error.value,
      query.pagination.value?.total,
      query.criteria.value.pagination?.offset
    ],
    ([isFetched, hasError, total, offset]) => {
      if (!isFetched || hasError || total !== 0) return;
      if (!offset) return;
      query.setCriteria({
        pagination: {
          limit: query.criteria.value.pagination?.limit ?? 10,
          offset: 0
        }
      });
    }
  );

  /**
   * Destroys this scoped instance — removes it from the registry so the
   * next `.as()` mints a fresh collection.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientOrders.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. Always settles. */
    isReady,

    /** Advances the list one page forward. */
    nextPage,

    /** Steps the list one page back. */
    prevPage,

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /**
     * Drops this collection's cached pages outright, so the next read
     * starts from the server rather than from what is held.
     *
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /** Jumps to the given page — replaces the whole `pagination` branch (design 8.3). */
    setPage,

    /** Sets the page size and returns to page one (design 8.3). */
    setLimit

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers. Named `...Collection...` — `UseClientOrdersActions`
// collides with the portal mock contract (`client-orders.types.ts` head `@decision`).
export type UseClientOrdersCollectionActions = ReturnType<
  typeof createClientOrdersActions
>;
