import { unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { remove } from "../scope";
import { stateMatches, stopService } from "../../utils";
import type { SetPasswordModel, VerifyRegistrationParams } from "./auth.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module auth/useVerifyRegistration.actions
 * @description Registration landing actions factory (machine events).
 */

const SETTLED_STATES = [
  "needsPassword",
  "success",
  "expiredOrInvalid",
  "completionFailed"
];

/**
 * Creates the landing actions that send events to the machine.
 * @internal
 */
export function createVerifyRegistrationActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { send, service } = actor;

  function completeRegistration(): void {
    send({ type: "COMPLETE" });
  }

  function destroy(): void {
    stopService(service);
    remove(scopeKey);
  }

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      snapshot => stateMatches(snapshot, SETTLED_STATES),
      {
        timeout: Infinity
      }
    ).then(() => true);
  }

  function reset(): void {
    send({ type: "RESET" });
  }

  function set(model: Partial<SetPasswordModel>): void {
    send({ type: "SET", data: unref(model) });
  }

  function verify(params: VerifyRegistrationParams): void {
    send({ type: "VERIFY", data: unref(params) });
  }

  // -----------------------------------------------------------------------------
  return {
    /** Submits the set-password form; the machine validates it first. No effect outside `needsPassword`. */
    completeRegistration,

    /** Destroys this scoped instance — stops the service and removes it from the registry. */
    destroy,

    /** Resolves once the landing settles at `needsPassword` or an outcome. */
    isReady,

    /** Runs the link check again from any state except `idle`. */
    reset,

    /** Merges a partial set-password model. */
    set,

    /** Starts the landing with the raw link values. Handled only in `idle`. */
    verify
  };
}

// Type export for consumers
export type UseVerifyRegistrationActions = ReturnType<
  typeof createVerifyRegistrationActions
>;
