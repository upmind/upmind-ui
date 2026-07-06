import { waitFor } from "xstate/lib/waitFor";
import { AuthFlowTypes } from "./auth.types";
import { stateMatches, waitForProcessing } from "../../utils";
import type { UseActor } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module auth/useAuth.actions.client
 * @description Client-specific auth actions.
 */

/**
 * Client-specific actions - extensions beyond the shared base.
 */
export function createClientAuthActions(actor: UseActor) {
  const { send, service } = actor;

  async function start(flow?: AuthFlowTypes): Promise<boolean> {
    const flowType = flow ?? AuthFlowTypes.LOGIN;
    const event = flowType.toUpperCase();

    // Settle once the flow leaves `.loading` — `.available` (form ready) or
    // `.unavailable` (schema load failed) — then report readiness. Waiting on
    // the bare flow prefix would match during `.loading` (register's initial
    // state), and waiting on `.available` alone would hang the full timeout when
    // the load fails and lands on the sibling `.unavailable`.
    send({ type: event });
    return waitFor(
      service,
      s =>
        stateMatches(s, [`${flowType}.available`, `${flowType}.unavailable`]),
      { timeout: 60_000 }
    )
      .then(s => stateMatches(s, `${flowType}.available`))
      .catch(() => false);
  }

  /**
   * Wait for auth machine to be ready (finished checking for existing session).
   * Resolves when in idle, login, register, recover, or authenticated states.
   */
  async function isReady(): Promise<boolean> {
    return waitForProcessing(service, [
      "idle",
      "login",
      "register",
      "recover",
      "authenticated"
    ]);
  }

  /**
   * Drive the guest-register path (M5) — two-step GUEST_CUSTOMER grant.
   * Gated on the machine by the canRegisterAsGuest guard (F3b); if the guard
   * blocks the transition, the machine stays idle and this resolves false.
   * @private
   */
  async function registerAsGuest(): Promise<boolean> {
    send({ type: "GUEST" });
    return waitForProcessing(service, "authenticated", "idle");
  }

  return {
    /**
     * Wait for auth machine to be ready.
     */
    isReady,

    /**
     * Drive the guest-register path (M5).
     * @returns True if the guest-customer was registered and authenticated.
     */
    registerAsGuest,

    /**
     * Start an auth flow.
     * Clients can start login, register, or recover flows.
     * @param flow - The auth flow to start.
     * @returns True if the flow started successfully, false otherwise.
     */
    start
  };
}
