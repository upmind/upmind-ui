import { nextTick, watch } from "vue";
import { usePayment as usePaymentEngine } from "../payment";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { OrderCancellationUnavailableError } from "./orders.errors";
import { resolveOrderCancellationPort } from "./orders.ports";
import { canCancel } from "./orders.utils";
import { NotAuthenticatedError } from "../../utils";
import type {
  OrderExtras,
  OrderItemQuery,
  OrdersServices
} from "./orders.types";
import type { PaymentArgs } from "../payment";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IOrder } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module orders/useOrder.actions
 * @description Manager actions — readiness, lifecycle, the pay delegate
 * (D-11) and the cancel delegate (D-13, D-21). Query-backed: `destroy()`
 * removes the registry entry, because there is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useOrder.actions.{actor}.ts` file exists.
 */
export function createOrderActions(
  _actorScope: ScopeActorTypes,
  service: OrdersServices,
  query: OrderItemQuery,
  scopeKey: string,
  orderId: IOrder["id"] | undefined,
  extras: OrderExtras
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

  /** Destroys this scoped instance — stops the gateway scope, then removes it from the registry. */
  function destroy(): void {
    extras.stopGatewaysScope();
    removeFromRegistry(scopeKey);
  }

  /**
   * D-11 — runs the `payment` engine INSIDE THE CALLER'S OWN SETUP, so the
   * engine binds its lifecycle to the active component; this delegate must not
   * be memoised here. The manager injects its own `orderId`; the caller passes
   * the chosen `paymentDetail` (owned by `payment-details`). Publishes the
   * engine's OWN members under the engine's OWN names (design 8.2) — withholds
   * `completeChallenge` (wired internally by `renderChallenge`) and invalidates
   * the shared `invoices` root key once the engine settles (D-4).
   *
   * @decision
   * what: re-point the pay delegate from the deleted `orders`/`useOrder`
   *   engine to the `payment` module. `usePayment` now takes the chosen
   *   `paymentDetail` and forwards `{ orderId, paymentDetail }`; the engine
   *   import is aliased `usePaymentEngine` to avoid clashing with this
   *   delegate's own name. Completion is watched on `meta.value.hasPaid` (was
   *   `isComplete`). `retry`, `paymentDetail` and `gateway` drop as top-level
   *   members — the engine has no `retry` (its `pay()` re-sends PAY) and
   *   surfaces the gateway and chosen method through `context`; `payment` (the
   *   attempt) is published in their place.
   * why: FE-3145 (commit 4de1d19778) deleted the `orders` pay engine.
   *   `payment` is its replacement and needs the chosen method up front — it
   *   resolves none itself. The manager owns `orderId`, not the method, so the
   *   caller supplies the `paymentDetail` that `payment-details` produced.
   * rejected: re-implementing pay inside orders (breaks the delegation
   *   law, D-1); editing `payment` to restore the old orderId-only signature
   *   ("do not extend orders", out of scope); a `pay(paymentDetailId?)` member
   *   on the manager surface (D-11 keeps `pay` off the manager).
   */
  function usePayment(paymentDetail: PaymentArgs["paymentDetail"]) {
    if (!orderId) throw new NotAuthenticatedError();
    const engine = usePaymentEngine({ orderId, paymentDetail });

    watch(
      () => engine.meta.value.hasPaid,
      hasPaid => {
        if (hasPaid)
          void invalidateQueryByKey(["invoices"], { exact: false })();
      }
    );

    return {
      pay: engine.pay,
      renderChallenge: engine.renderChallenge,
      cancelChallenge: engine.cancelChallenge,
      refresh: engine.refresh,
      isReady: engine.isReady,
      meta: engine.meta,
      errors: engine.errors,
      context: engine.context,
      payment: engine.payment
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
    return port(raw.contract_id)
      .then(() => invalidateQueryByKey(["invoices"], { exact: false })())
      .finally(() => {
        extras.isProcessing.value = false;
      });
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useOrder.actions.{actor}.ts` and spread it LAST so it wins.

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
export type UseOrderManagerActions = ReturnType<typeof createOrderActions>;
