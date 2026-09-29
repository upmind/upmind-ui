import type { UseActor } from "../../utils";
import type { useBasketCurrency } from "../basket";
import type { usePaymentDetail, usePaymentGateway } from "../payment-details";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.internals
 * @description Single-invoice internals — the raw machine handles for debugging,
 * plus the delegated composables the pay UI provides/injects: `gateway`,
 * `paymentDetail`, and `basketCurrency` (the pay currency
 * `useActions().setCurrency()` sets).
 *
 * @decision
 * what: expose the delegated `gateway` / `paymentDetail` / `basketCurrency`
 * composables on internals rather than on context (a departure from the
 * canonical internals, which carries only `send` / `state` / `service`).
 * why: the scenario port reflects `useContext()` with
 * `omitBy(mapValues(ctx, unref), isFunction)` — a live composable placed on
 * context would be serialised/reflected, and its reactive internals are not
 * plain data. Internals is not reflected, so the pay UI still reaches them
 * (`Order.vue` provides `paymentDetail`) without polluting the port.
 * rejected: placing them on context — reflected by the scenario port; and a
 * fifth top-level layer — the four-layer return is fixed (clause 1).
 */
export function createInvoiceInternals(
  actorScope: ScopeActorTypes,
  actor: UseActor,
  paymentDetail: ReturnType<typeof usePaymentDetail>,
  gateway: ReturnType<typeof usePaymentGateway>,
  basketCurrency: ReturnType<typeof useBasketCurrency>
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** Delegated basket-currency composable; `input()` stages the pay currency. */
    basketCurrency,

    /** Delegated payment-gateway composable. */
    gateway,

    /** Delegated payment-detail composable (for provide/inject). */
    paymentDetail,

    /** Raw send function for machine events. */
    send: actor.send,

    /** Raw XState service. */
    service: actor.service,

    /** Raw XState state ref. */
    state: actor.state
  };
}

// Type export for consumers
export type UseInvoiceInternals = ReturnType<typeof createInvoiceInternals>;
