import { computed } from "vue";
import { contextValue, stateMatches } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { ProfileContext } from "./client-personal-details.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetailsManager.meta
 * @description Manager meta — FLAT computeds, one per flag, read through the
 * canonical state utilities only.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createPersonalDetailsManagerMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  /** True once the form is available for input. */
  const isAvailable = computed(() => stateMatches(state, "available"));

  /**
   * True while the machine is waiting for its client id or resolving
   * lookups. `subscribing` is included deliberately: a manager whose
   * `hasSubscription` guard has not passed yet is loading, not broken.
   */
  const isLoading = computed(() =>
    stateMatches(state, ["subscribing", "loading"])
  );

  /** True if the machine captured an error. */
  const hasErrors = computed(
    () =>
      stateMatches(state, "available.error") ||
      !isEmpty(contextValue<ProfileContext["error"]>(state, "error"))
  );

  /** True if a validation error exists AND the form has been touched. */
  const showErrors = computed(
    () =>
      !isEmpty(contextValue<ProfileContext["error"]>(state, "error")) &&
      stateMatches(state, ["available.invalid", "available.error"])
  );

  /** True if the current model passes schema validation. */
  const isValid = computed(() => stateMatches(state, "available.valid"));

  /** True if the model differs from its persisted baseline. */
  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<ProfileContext["model"]>(state, "model"),
        contextValue<ProfileContext["baseModel"]>(state, "baseModel")
      )
  );

  /** True while a save is being processed. */
  const isProcessing = computed(() => stateMatches(state, "processing"));

  /** True once the profile has been saved. */
  const isComplete = computed(() =>
    stateMatches(state, ["processed", "complete"])
  );

  // --- actor-specific meta: none earned yet (clause 2).

  return {
    /** True if the machine captured an error. */
    hasErrors,

    /** True once the form is available for input. */
    isAvailable,

    /** True once the profile has been saved. */
    isComplete,

    /** True if the model differs from its persisted baseline. */
    isDirty,

    /** True while subscribing or loading. */
    isLoading,

    /** True while a save is being processed. */
    isProcessing,

    /** True if the current model passes schema validation. */
    isValid,

    /** True if an error exists and the form has been touched. */
    showErrors

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UsePersonalDetailsManagerMeta = ReturnType<
  typeof createPersonalDetailsManagerMeta
>;
