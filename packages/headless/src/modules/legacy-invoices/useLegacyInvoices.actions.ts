import { nextTick, watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  LegacyInvoiceFilterModel,
  LegacyInvoiceSortModel,
  LegacyInvoicesListQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoices.actions
 * @description Collection actions — list controls and lifecycle. Read-only:
 * no write member exists (FE-3230 Out of Scope, AC13). Query-backed:
 * `destroy()` removes the registry entry, because there is no service to
 * stop. Ruling B7 — the COLLECTION ships `reset`, the MANAGER does not.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useLegacyInvoices.actions.{actor}.ts` file
 * exists.
 */
export function createLegacyInvoicesActions(
  _actorScope: ScopeActorTypes,
  service: LegacyInvoicesServices,
  query: LegacyInvoicesListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /** A first fetch that never settles must not leave `isReady()` waiting forever. */
  const READY_TIMEOUT_MS = 10_000;

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
   * settles without an addressable client, or once the fetch itself times
   * out. Always SETTLES.
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
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Applies a filter INTENT — the `filters` branch of the one query model, so
   * `sort` and `pagination` are untouched by construction.
   */
  function filterBy(intent: LegacyInvoiceFilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /**
   * Applies a sort INTENT — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched.
   */
  function sortBy(intent: LegacyInvoiceSortModel): void {
    query.setCriteria({ sort: intent });
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
  // `useLegacyInvoices.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Applies a filter intent to the list — merges the `filters` branch. */
    filterBy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. Always settles. */
    isReady,

    /** Advances the list one page forward. */
    nextPage: query.fetchNextPage,

    /** Steps the list one page back. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /**
     * Drops this collection's cached pages outright, so the next read starts
     * from the server rather than from what is held (ruling B7).
     *
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. The single write verb: the schema governs what is
     * spellable, so a raw `filter[col]` key or a raw sort tuple is
     * unreachable here.
     */
    setCriteria: query.setCriteria,

    /** Applies a sort intent to the list — merges the `sort` branch. */
    sortBy

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseLegacyInvoicesActions = ReturnType<
  typeof createLegacyInvoicesActions
>;
