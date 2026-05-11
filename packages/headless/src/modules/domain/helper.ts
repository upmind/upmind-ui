// -----------------------------------------------------------------------------
/**
 * @module domain/helper
 * @description Spawned helper actor for parallel `/availability` pre-flight
 * checks.
 */

// --- internal
import services from "./services";

// --- types
import type { DacContext } from "./types";

// -----------------------------------------------------------------------------

/**
 * Spawned actor that runs `/availability` pre-flight checks in parallel.
 *
 * XState's `invoke` runs one service at a time per state, so when the user
 * clicks several suggestion rows in quick succession only the first click
 * could fire a pre-check. Routing every click through this helper instead
 * sidesteps that restriction — each `VERIFY` event triggers an independent
 * fire-and-forget `checkAvailability` call, and the result is dispatched
 * back to the parent machine as `VERIFY_RESULT` (or `VERIFY_ERROR`) keyed
 * by domain so rows can be correlated reliably even when results return
 * out of order.
 *
 * NB: Must be a plain function (NOT async). XState v4 treats an async
 * function passed to `spawn()` as a promise actor — `onReceiveEvent` would
 * never be registered and incoming `VERIFY` events would silently vanish.
 */
export function domainAvailabilityHelper(callback: any, onReceiveEvent: any) {
  const onReceive = (event: any) => {
    if (event.type !== "VERIFY") return;
    const { data: domain, context } = event;
    if (!domain) return;

    services
      .checkAvailability({
        ...(context ?? {}),
        checkingDomain: domain
      } as DacContext)
      .then(availability => {
        callback({
          type: "VERIFY_RESULT",
          data: domain,
          availability
        });
      })
      .catch(error => {
        if (error?.name === "AbortError") return;
        callback({
          type: "VERIFY_ERROR",
          data: domain,
          error
        });
      });
  };

  onReceiveEvent(onReceive);
}
