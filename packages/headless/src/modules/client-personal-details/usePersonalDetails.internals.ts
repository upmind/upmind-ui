import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetails.internals
 * @description Manager internals (debugging) — `send`/`state`/`service`.
 * @doctrine clause 1 (uniform four-layer default) — machine-variant form.
 */
export function createPersonalDetailsInternals(
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
export type UsePersonalDetailsInternals = ReturnType<
  typeof createPersonalDetailsInternals
>;
