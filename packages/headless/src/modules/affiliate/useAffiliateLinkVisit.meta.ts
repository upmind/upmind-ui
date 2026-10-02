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
    hasFailed: Ref<boolean>;
    isVisiting: Ref<boolean>;
    lastResponse: Ref<{ target: string } | undefined>;
  }
) {
  return {
    /** `true` when the last `visit()` could not record the attribution. */
    hasError: computed(() => deps.hasFailed.value),

    /** `true` once a `visit()` call has resolved. */
    hasVisited: computed(() => !!deps.lastResponse.value),

    /** `true` while a `visit()` request is in flight. */
    isLoading: computed(() => deps.isVisiting.value)
  };
}

export type UseAffiliateLinkVisitMeta = ReturnType<
  typeof createAffiliateLinkVisitMeta
>;
