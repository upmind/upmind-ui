import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkVisit.context
 * @description The last visit outcome, read-only.
 */
export function createAffiliateLinkVisitContext(
  _actorScope: ScopeActorTypes,
  deps: {
    lastResponse: Ref<{ target: string } | undefined>;
  }
) {
  return {
    /** The target of the last `visit()` call, else `undefined`. */
    target: deps.lastResponse
  };
}

export type UseAffiliateLinkVisitContext = ReturnType<
  typeof createAffiliateLinkVisitContext
>;
