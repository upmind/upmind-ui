import { nextTick, watch } from "vue";
import { useOrder } from "../orders";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { OrderCancellationUnavailableError } from "./client-orders.errors";
import { resolveOrderCancellationPort } from "./client-orders.ports";
import { canCancel } from "./client-orders.utils";
import { NotAuthenticatedError } from "../../utils";
import type {
  ClientOrderExtras,
  ClientOrderItemQuery,
  ClientOrderServices
} from "./client-orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IOrder } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrder.actions
 * @description Manager actions — readiness, lifecycle, the pay delegate
 * (D-11) and the cancel delegate (D-13, D-21). Query-backed: `destroy()`
 * removes the registry entry, because there is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientOrder.actions.{actor}.ts` file exists.
 */
export function createClientOrderActions(
  _actorScope: ScopeActorTypes,
  service: ClientOrderServices,
  query: ClientOrderItemQuery,
  scopeKey: string,
  orderId: IOrder["id"] | undefined,
  extras: ClientOrderExtras
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /** Bounds `isReady()` so it always SETTLES rather than hanging forever. */
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
   * Resolves once the single read is ready. Always SETTLES.
   * @returns true once the first fetch has settled, false if the session
   * settles with no addressable client, or once the fetch itself times out.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /**
   * Forces a re-read of this order from the server (D-12 — the page calls
   * this on each enter, because a scoped instance can outlive the view).
   * @throws {NotAuthenticatedError} when the session cannot address this order.
   */
  async function refresh(): Promise<void> {
    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /** Destroys this scoped instance — removes it from the registry. */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  /**
   * D-11 — runs `useOrder(order.id)` INSIDE THE CALLER'S OWN SETUP: `useOrder`
   * binds `onUnmounted` to whatever component instance is active when it
   * runs, so this delegate must not be memoised here. Publishes the engine's
   * OWN members under the engine's OWN names (design 8.2) — `invoice` and
   * `completeChallenge` are not published, and it invalidates the shared
   * `invoices` root key once the engine completes (D-4).
   */
  function usePayment() {
    const engine = useOrder(orderId as string);

    watch(
      () => engine.meta.value.isComplete,
      isComplete => {
        if (isComplete)
          void invalidateQueryByKey(["invoices"], { exact: false })();
      }
    );

    return {
      pay: engine.pay,
      retry: engine.retry,
      renderChallenge: engine.renderChallenge,
      cancelChallenge: engine.cancelChallenge,
      refresh: engine.refresh,
      isReady: engine.isReady,
      meta: engine.meta,
      errors: engine.errors,
      paymentDetail: engine.paymentDetail,
      gateway: engine.gateway
    };
  }

  /**
   * D-13, D-21 — delegates to the injected cancellation port with the
   * order's `contract_id`. Resolves with no port call when `canCancel` is
   * false; rejects with {@link OrderCancellationUnavailableError} with no
   * port call when no flow has registered one (FE-3237 ticket AC14).
   */
  async function cancel(): Promise<void> {
    const raw = query.data.value;
    if (!raw || !canCancel(raw)) return;

    const port = resolveOrderCancellationPort();
    if (!port) throw new OrderCancellationUnavailableError();

    extras.isProcessing.value = true;
    try {
      await port(raw.contract_id);
      await invalidateQueryByKey(["invoices"], { exact: false })();
    } finally {
      extras.isProcessing.value = false;
    }
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientOrder.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** D-13, D-21 — delegates cancellation to the injected port (design 8.2, 6.5). */
    cancel,

    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the single read is ready. Always settles. */
    isReady,

    /** Refetches the order from the server; rejects if it cannot be addressed. */
    refresh,

    /**
     * Drops this order's cached read outright, so the next read starts from
     * the server rather than from what is held.
     *
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /** D-11 — the pay delegate. Call inside the caller's OWN component setup. */
    usePayment

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientOrderManagerActions = ReturnType<
  typeof createClientOrderActions
>;
