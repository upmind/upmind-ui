import { computed } from "vue";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkVisit.meta
 * @description Derived flags over the last visit outcome.
 */
export function createAffiliateLinkVisitMeta(
  _actorScope: ScopeActorTypes,
  deps: {
    lastResponse: Ref<{ target: string } | undefined>;
  }
) {
  return {
    /** `true` once a `visit()` call has resolved. */
    hasVisited: computed(() => !!deps.lastResponse.value)
  };
}

export type UseAffiliateLinkVisitMeta = ReturnType<
  typeof createAffiliateLinkVisitMeta
>;
