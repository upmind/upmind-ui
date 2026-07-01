import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module account/useAccount.internals
 * @description Account internals sub-composable.
 */

/**
 * Creates account internals for debugging.
 * @internal
 */
export function createAccountInternals(
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
export type UseAccountInternals = ReturnType<typeof createAccountInternals>;
