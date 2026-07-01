import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module auth/useAuth.internals
 * @description Auth internals sub-composable.
 */

/**
 * Creates auth internals for debugging.
 * @internal
 */
export function createAuthInternals(
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
export type UseAuthInternals = ReturnType<typeof createAuthInternals>;
