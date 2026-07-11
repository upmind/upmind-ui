import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.internals
 * @description Client-email manager internals sub-composable (debugging).
 */

/**
 * Creates the client-email manager internals for debugging.
 * @internal
 */
export function createClientEmailManagerInternals(
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
export type UseClientEmailManagerInternals = ReturnType<
  typeof createClientEmailManagerInternals
>;
