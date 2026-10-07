import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module auth/useVerifyRegistration.internals
 * @description Registration landing internals sub-composable.
 */

/**
 * Creates the landing internals for debugging.
 * @internal
 */
export function createVerifyRegistrationInternals(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw send function for machine events. */
    send: actor.send,
    /** Raw XState service. */
    service: actor.service,
    /** Raw XState state ref. */
    state: actor.state
  };
}

// Type export for consumers
export type UseVerifyRegistrationInternals = ReturnType<
  typeof createVerifyRegistrationInternals
>;
