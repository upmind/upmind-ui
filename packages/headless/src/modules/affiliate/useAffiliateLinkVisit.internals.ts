import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkVisit.internals
 * @description Diagnostics only — `actorScope` and the last visit response
 * (design.md §5.2).
 */
export function createAffiliateLinkVisitInternals(
  actorScope: ScopeActorTypes,
  deps: {
    lastResponse: Ref<{ target: string } | undefined>;
  }
) {
  return {
    actorScope,
    lastResponse: deps.lastResponse
  };
}

export type UseAffiliateLinkVisitInternals = ReturnType<
  typeof createAffiliateLinkVisitInternals
>;
