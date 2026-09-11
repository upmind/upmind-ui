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
   * Gated on the machine by the canRegisterAsGuest guard (F3b).
   * @private
   */
  async function registerAsGuest(): Promise<boolean> {
    // Settle past `checking` first: the shared instance may sit anywhere the gate
    // left it (`idle`, or a `login` form), and GUEST is a global transition off
    // whichever that is.
    await isReady();
    send({ type: "GUEST" });
    // Guard blocked (GUEST_CHECKOUT disabled): GUEST is ignored and the machine
    // never enters the guest-register flow.
    if (!stateMatches(service, "registeringGuest")) return false;
    // `authenticated` is a final state, so entering it settles the machine
    // `done`; count `done` a success or the settle reads as a failure.
    return waitForProcessing(service, ["authenticated", "done"]);
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
