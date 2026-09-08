import { nextTick, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import {
  consolidatableCriteria,
  creditNotesCriteria
} from "./invoices.schemas";
import { NotAuthenticatedError } from "../../utils";
import type {
  Invoice,
  InvoiceFilterModel,
  InvoiceSortableField,
  InvoicesListQuery,
  InvoicesServices
} from "./invoices.types";
import type { SortDirection } from "../query/query.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices.actions
 * @description Collection actions — list controls, the criteria presets AC2
 * and AC7 need, the assigned-method writer (AC4), the payment-outcome
 * refetch (AC3), and lifecycle. Query-backed: `destroy()` removes the
 * registry entry, because there is no service to stop.
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
   * A first fetch that never settles (a hung request, a dropped connection)
   * would otherwise leave `isReady()` waiting forever — the uncapped 100ms
   * poll at the pre-conversion `useInvoice.ts:46-59` this replaces. This
   * bound is the fix: `isReady()` always SETTLES, resolving `false` on
   * exhaustion rather than hanging a caller's `await`.
   */
  const READY_TIMEOUT_MS = 10_000;

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling. Reads `service.isAvailable` — the same
   * predicate the list query's `enabled` and `guard` call — so readiness
   * cannot wait on a fetch that is not coming (a gated query may never
   * fetch).
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

  /**
   * Resolves once the list query has completed its first fetch, or `false`
   * once {@link READY_TIMEOUT_MS} elapses with no settlement.
   */
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
   * AC3 — the list-side refetch a payment outcome triggers. The module owns
   * only the observe-and-refetch half; the payment flow itself is PN-1, out
   * of scope.
   */
  async function refreshAfterPayment(): Promise<void> {
    return refresh();
  }

  /**
   * Applies a filter INTENT — the `filters` branch of the one query model, so
   * `sort` and `pagination` are untouched by construction.
   */
  function filterBy(intent: InvoiceFilterModel): void {
    query.setCriteria({ filters: intent });
  }

  /**
   * Applies a sort intent — the `sort` branch of the one query model, so
   * `filters` and `pagination` are untouched.
   */
  function sortBy(field: InvoiceSortableField, dir: SortDirection): void {
    query.setCriteria({ sort: [{ field, dir }] });
  }

  /**
   * AC2's preset — narrows the VISIBLE list to invoices this client could
   * consolidate. `clientId` defaults to this scope's resolved target
   * (`service.clientId`) (`invoices.schemas.ts`'s `consolidatableCriteria`).
   * The notice/CTA COUNT is a separate reader — `useMeta().consolidatableCount`
   * — over its own dedicated query, never this list's criteria; the two
   * coexist because reading the count no longer mutates what this preset
   * filters.
   */
  function filterConsolidatable(clientId?: string): void {
    query.setCriteria(
      consolidatableCriteria(clientId ?? service.clientId.value)
    );
  }

  /**
   * AC7's preset — applies the credit-notes criteria, narrowed to one
   * invoice's credit notes when `invoiceId` is given
   * (`invoices.schemas.ts`'s `creditNotesCriteria`).
   */
  function filterCreditNotes(invoiceId?: string): void {
    query.setCriteria(creditNotesCriteria(invoiceId));
  }

  /**
   * AC4 — assigns (or clears, with `null`) the payment method for one
   * invoice, then invalidates the shared `invoices` cache key — which covers
   * both the list and the single-read item key, since both are keyed under
   * the same base (`invoices.services.ts`'s `queryKey`).
   */
  async function assignPaymentMethod(
    invoiceId: Invoice["id"],
    paymentDetailsId: string | null
  ): Promise<unknown> {
    return service
      .updatePaymentDetails(invoiceId, { payment_details_id: paymentDetailsId })
      .then(invalidateQueryByKey(service.queryKey, { exact: false }));
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
    /** AC4 — assigns or clears the payment method, then invalidates. */
    assignPaymentMethod,

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

    /** AC3 — the list-side refetch a payment outcome triggers. */
    refreshAfterPayment,

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
