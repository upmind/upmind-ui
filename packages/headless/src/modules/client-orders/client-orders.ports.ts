import type { ClientOrderCancellationPort } from "./client-orders.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.ports
 * @description The injectable cancellation port (D-21, FE-3237 ticket AC14).
 * FE-3040 registers the live contract-cancellation flow here; until it
 * does, `cancel()` rejects with `OrderCancellationUnavailableError`.
 *
 * @decision
 * what: `client-orders.ports.ts` is an extra file beyond the query
 *   template's set — the injectable cancellation port
 *   `useClientOrder.actions.ts`'s `cancel()` delegates to (D-21, FE-3237
 *   ticket AC14).
 * why: the manager's `cancel()` must call a flow this story does not own
 *   (FE-3040's contract-cancellation flow, not yet built); a registration
 *   seam lets that flow connect later with no change to this module.
 * rejected: a bespoke event/callback wired through `client-orders.services.ts`
 *   (a services file is a request layer, not a registration seam —
 *   `file-responsibility/services-purity`); inlining a TODO stub in
 *   `useClientOrder.actions.ts` (leaves `cancel()` with no real seam to test).
 */
// -----------------------------------------------------------------------------

let currentPort: ClientOrderCancellationPort | undefined;

/** The manager's `cancel()` reads the currently registered port, if any. */
export function resolveOrderCancellationPort():
  | ClientOrderCancellationPort
  | undefined {
  return currentPort;
}

/**
 * Registers the cancellation port. Returns a remover that clears the
 * registration ONLY while the port it closed over is still the current one
 * — a later registration's remover is the sole owner of clearing it.
 */
export function provideOrderCancellation(
  port: ClientOrderCancellationPort
): () => void {
  currentPort = port;

  return () => {
    if (currentPort === port) currentPort = undefined;
  };
}
