import { computed } from "vue";
import { stateValue, contextValue, stateMatches } from "../../utils";
import { isEqual } from "lodash-es";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.meta
 * @description Client-email manager meta factory (computed state flags).
 */

/**
 * Creates the client-email manager meta (computed state flags).
 * @internal
 */
export function createClientEmailManagerMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const meta = computed(() => ({
    /** True once the form is available for input. */
    isAvailable: stateMatches(state, "available"),
    /** True while subscribing or loading lookups. */
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    /** True if the available form has errors. */
    hasErrors: stateMatches(state, "available.error"),
    /** True if the current model is valid. */
    isValid: stateMatches(state, "available.valid"),
    /** True if the model differs from its persisted baseline. */
    isDirty: !isEqual(
      contextValue<DataManagerContext["model"]>(state, "model"),
      contextValue<DataManagerContext["baseModel"]>(state, "baseModel")
    ),
    /** True if the email is new (not yet saved). */
    isNew: !stateMatches(state, "model.id"),
    /** True while a save is being processed. */
    isProcessing: stateMatches(state, "processing"),
    /** True once the email has been saved/completed. */
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"])
  }));

  // ---------------------------------------------------------------------------
  return {
    /** Meta-information about the manager state. */
    meta
  };
}

// Type export for consumers
export type UseClientEmailManagerMeta = ReturnType<
  typeof createClientEmailManagerMeta
>;
