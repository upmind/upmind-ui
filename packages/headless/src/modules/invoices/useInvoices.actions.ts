import { until } from "@vueuse/core";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { CONSOLIDATABLE_FILTER, CREDIT_NOTE_FILTER } from "./invoices.types";
import { NotAuthenticatedError } from "../../utils";
import type {
  InvoiceFilterModel,
  InvoiceSortModel,
  InvoicesListQuery,
  InvoicesServices
} from "./invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices.actions
 * @description Collection actions — list controls, the criteria presets AC2
 * and AC7 apply (`CONSOLIDATABLE_FILTER` / `CREDIT_NOTE_FILTER`, defined in
 * `invoices.types.ts`), and lifecycle. Query-backed: `destroy()` removes the
 * registry entry, because there is no service to stop. The single invoice's
 * payment-method write lives on `useInvoice` (the flat single-invoice
 * composable), never on the list.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useInvoices.actions.{actor}.ts` file exists.
 */
export function createInvoicesActions(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoicesListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * Resolves once the collection is ready to read. The session gate is
   * load-bearing: the list query is disabled until this scope can address a
   * client, so readiness first waits for the session to settle — either this
   * scope becomes addressable, or the session finishes settling without one —
   * then, only when addressable, for the first fetch to complete.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client.
   */
  async function isReady(): Promise<boolean> {
    await until(
      () =>
        service.isAvailable.value ||
        isSessionInitialised.value ||
        !isSessionSettling.value
    ).toBe(true);

    if (!service.isAvailable.value) return false;

    await until(query.isFetched).toBe(true);
    return true;
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
  function filterBy(intent: InvoiceFilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /**
   * Applies a sort INTENT — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched.
   */
  function sortBy(intent: InvoiceSortModel): void {
    query.setCriteria({ sort: intent });
  }

  /** AC2 — narrows the list to invoices this client could consolidate. */
  function filterConsolidatable(clientId?: string): void {
    query.setCriteria({
      filters: {
        ...CONSOLIDATABLE_FILTER,
        client_id: clientId ?? service.clientId.value
      }
    });
  }

  /** AC7 — credit notes as a filtered view of this same collection. */
  function filterCreditNotes(): void {
    query.setCriteria({ filters: CREDIT_NOTE_FILTER });
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
  // `useInvoices.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Applies a filter intent to the list — merges the `filters` branch. */
    filterBy,

    /** AC2 — applies the consolidatable-count criteria preset. */
    filterConsolidatable,

    /** AC7 — applies the credit-notes criteria preset. */
    filterCreditNotes,

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
     * from the server rather than from what is held. `invalidate` marks the
     * key stale and keeps the rows on screen; this clears them.
     *
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. The single write verb: the schema governs what is
     * spellable, so a legacy `filter[col]` key or a raw sort tuple is
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
export type UseInvoicesActions = ReturnType<typeof createInvoicesActions>;
