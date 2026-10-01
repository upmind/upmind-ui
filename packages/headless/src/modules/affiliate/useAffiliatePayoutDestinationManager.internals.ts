import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayoutDestinationManager.internals
 * @description Manager internals (debugging).
 */
export function createAffiliatePayoutDestinationManagerInternals(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  return {
    actorScope,
    send: actor.send,
    service: actor.service,
    state: actor.state
  };
}

export type UseAffiliatePayoutDestinationManagerInternals = ReturnType<
  typeof createAffiliatePayoutDestinationManagerInternals
>;
