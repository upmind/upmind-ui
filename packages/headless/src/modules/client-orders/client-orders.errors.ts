// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.errors
 * @description The cancellation-port error (D-21, FE-3237 ticket AC14).
 * `cancel()` throws this when `canCancel` is true but no flow has connected
 * to the cancellation port yet.
 *
 * @decision
 * what: `client-orders.errors.ts` is an extra file beyond the query
 *   template's set — the typed error `useClientOrder.actions.ts`'s
 *   `cancel()` throws when `client-orders.ports.ts` has no registered
 *   cancellation flow.
 * why: a named error class lets a consumer `instanceof`-check the
 *   unregistered-port case distinctly from a wire failure, matching how
 *   this module already types `NotAuthenticatedError`.
 * rejected: a generic `Error` (a consumer cannot distinguish "no flow
 *   connected yet" from any other rejection); folding the class into
 *   `client-orders.ports.ts` (a `*.errors.ts` file is this codebase's
 *   convention for a typed error, matching every other module).
 */
// -----------------------------------------------------------------------------

/** Thrown by `cancel()` when `canCancel` is true but no cancellation port is registered. */
export class OrderCancellationUnavailableError extends Error {
  constructor() {
    super("No cancellation flow is connected to this order.");
    this.name = "OrderCancellationUnavailableError";
  }
}
