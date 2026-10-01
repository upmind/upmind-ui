import { computed } from "vue";
import { contextValue, stateMatches } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { AffiliateLinkManagerContext } from "./affiliate.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkManager.meta
 * @description Manager meta — FLAT computeds (design.md §8.6).
 */
export function createAffiliateLinkManagerMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const isAvailable = computed(() => stateMatches(state, "available"));

  const isLoading = computed(() =>
    stateMatches(state, ["subscribing", "loading"])
  );

  /** design.md §8.2 Failure surface, §8.6 — `hasError`, matching this module's
   * naming convention (`useAffiliateLinks.meta.ts` et al.); `hasErrors` is
   * the manager-exemplar alias. */
  const hasError = computed(
    () =>
      stateMatches(state, "available.error") ||
      !isEmpty(
        contextValue<AffiliateLinkManagerContext["error"]>(state, "error")
      )
  );
  const hasErrors = hasError;

  const isValid = computed(() => stateMatches(state, "available.valid"));

  const isNew = computed(
    () => !contextValue<AffiliateLinkManagerContext["id"]>(state, "id")
  );

  /**
   * @decision a create is dirty on open whatever its seed.
   * what: `isDirty` is `isNew || model differs from baseModel`.
   * why: legacy `hasChange` compares the two-key form with `{}` (the unsaved
   *      link), so a create is always changed (design.md §8.4, create).
   *      The model parser drops empty values, so an empty brand default
   *      seeds `{}` and would equal `baseModel`.
   * rejected: seeding a non-empty `baseModel` — breaks `revert` on a create.
   */
  const isDirty = computed(
    () =>
      isNew.value ||
      !isEqual(
        contextValue<AffiliateLinkManagerContext["model"]>(state, "model"),
        contextValue<AffiliateLinkManagerContext["baseModel"]>(
          state,
          "baseModel"
        )
      )
  );

  const isProcessing = computed(() => stateMatches(state, "processing"));

  const isComplete = computed(() =>
    stateMatches(state, ["processed", "complete"])
  );

  return {
    hasError,
    hasErrors,
    isAvailable,
    isComplete,
    isDirty,
    isLoading,
    isNew,
    isProcessing,
    isValid
  };
}

export type UseAffiliateLinkManagerMeta = ReturnType<
  typeof createAffiliateLinkManagerMeta
>;
