import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkManager.internals
 * @description Manager internals (debugging).
 */
export function createAffiliateLinkManagerInternals(
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

export type UseAffiliateLinkManagerInternals = ReturnType<
  typeof createAffiliateLinkManagerInternals
>;
