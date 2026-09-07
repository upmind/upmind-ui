import { nextTick, watch } from "vue";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type {
  InvoiceItemQuery,
  InvoiceUnpaidAmountQuery,
  InvoicesServices
} from "./invoices.types";
import type { Currency } from "../currency/currency.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.actions
 * @description Single-read actions — lifecycle and AC1's unpaid-amount
 * re-read. Query-backed: `destroy()` removes the registry entry, because
 * there is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useInvoice.actions.{actor}.ts` file exists.
 */
export function createInvoiceActions(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoiceItemQuery,
  unpaidAmountQuery: InvoiceUnpaidAmountQuery,
  currencyId: Ref<Currency["id"] | undefined>,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * A first fetch that never settles would otherwise leave `isReady()`
   * waiting forever — the uncapped 100ms poll at the pre-conversion
   * `useInvoice.ts:46-59` this replaces. This bound is the fix: `isReady()`
   * always SETTLES, resolving `false` on exhaustion.
   */
  const READY_TIMEOUT_MS = 10_000;

  /**
   * This scope's settled ADDRESSABILITY outcome, or `undefined` while the
   * session is still settling. Reads `service.isAvailable` — the same
   * predicate `loadOne`'s `enabled` and `guard` call.
   */
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

  /**
   * Resolves once the item query has completed its first fetch, or `false`
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
   * Resolves once the invoice is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client, or once the fetch times out.
   * Always SETTLES.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /**
   * Forces a re-read of the invoice from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * AC1 — re-reads the live unpaid amount, on demand and after a currency
   * change. Setting `currencyId` re-keys the query (a new fetch, never a
   * cache hit for the prior currency); the explicit `refetch()` also covers
   * "on demand" with no currency change.
   */
  async function refreshUnpaidAmount(
    nextCurrencyId?: Currency["id"]
  ): Promise<void> {
    if (nextCurrencyId !== undefined) currencyId.value = nextCurrencyId;
    await nextTick();
    await unpaidAmountQuery.refetch();
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.withId(id)` mints a fresh read.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useInvoice.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the invoice is ready to read. Always settles. */
    isReady,

    /** Refetches the invoice from the server; rejects if it cannot address one. */
    refresh,

    /** AC1 — re-reads the live unpaid amount, on demand or on currency change. */
    refreshUnpaidAmount

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseInvoiceActions = ReturnType<typeof createInvoiceActions>;
