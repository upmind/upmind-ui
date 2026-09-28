import type { ClientOrderCancellationPort } from "./client-orders.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/client-orders.ports
 * @description The injectable cancellation port (D-21, FE-3237 ticket AC14).
 * FE-3040 registers the live contract-cancellation flow here; until it
 * does, `cancel()` rejects with `OrderCancellationUnavailableError`.
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
