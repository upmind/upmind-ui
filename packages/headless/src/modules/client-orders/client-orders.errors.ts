// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.errors
 * @description The cancellation-port error (D-21, FE-3237 ticket AC14).
 * `cancel()` throws this when `canCancel` is true but no flow has connected
 * to the cancellation port yet.
 */
// -----------------------------------------------------------------------------

/** Thrown by `cancel()` when `canCancel` is true but no cancellation port is registered. */
export class OrderCancellationUnavailableError extends Error {
  constructor() {
    super("No cancellation flow is connected to this order.");
    this.name = "OrderCancellationUnavailableError";
  }
}
