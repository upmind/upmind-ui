import { waitFor } from "xstate/lib/waitFor";
import { stateMatches, waitForProcessing } from "../../utils";
import type { UseActor } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module auth/useAuth.actions.staff
 * @description Staff-specific auth actions.
 */

/**
 * Staff-specific actions - extensions beyond the shared base.
 */
export function createStaffAuthActions(actor: UseActor) {
  const { send, service } = actor;

  async function start(): Promise<boolean> {
    send({ type: "LOGIN" });
    return waitFor(service, s => stateMatches(s, "login"), {
      timeout: 60_000
    })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Wait for auth machine to be ready (finished checking for existing session).
   * Staff can be in idle, login, or authenticated states.
   */
  async function isReady(): Promise<boolean> {
    return waitForProcessing(service, ["idle", "login", "authenticated"]);
  }

  return {
    /**
     * Wait for auth machine to be ready.
     */
    isReady,

    /**
     * Start an auth flow.
     * Staff can only start login flow (no register or recover).
     */
    start
  };
}
