import { computed } from "vue";
import { contextValue, stateMatches, stateValue } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { VaultAssetContext } from "./client-notes.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/useClientNoteManager.meta
 * @description Manager meta — FLAT computeds, one per flag, read through the
 * canonical state utilities only.
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientNoteManagerMeta(
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
      !isEmpty(contextValue<VaultAssetContext["error"]>(state, "error"))
  );

  /** True if the current model passes schema validation. */
  const isValid = computed(() => stateMatches(state, "available.valid"));

  /** True if the model differs from its persisted baseline. */
  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<VaultAssetContext["model"]>(state, "model"),
        contextValue<VaultAssetContext["baseModel"]>(state, "baseModel")
      )
  );

  /**
   * True if the asset is new. Reads the context `id` the machine's own
   * `isNew` guard reads (`({ id }) => !id`), not a `stateMatches` call against
   * a context path — which can only ever return false (the `client-phone` M10
   * receipt).
   */
  const isNew = computed(
    () => !contextValue<VaultAssetContext["id"]>(state, "id")
  );

  /** True while a save is being processed. */
  const isProcessing = computed(() => stateMatches(state, "processing"));

  /** True once the asset has been saved. */
  const isComplete = computed(
    () =>
      stateValue<boolean>(state, "done", false) === true ||
      stateMatches(state, ["processed", "complete"])
  );

  /** True while the asset being edited is a secret — the flag the form's contract follows (row M7). */
  const isSecret = computed(
    () => !!contextValue<VaultAssetContext["model"]>(state, "model")?.encrypted
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientNoteManager.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the machine captured an error. */
    hasErrors,

    /** True once the form is available for input. */
    isAvailable,

    /** True once the asset has been saved. */
    isComplete,

    /** True if the model differs from its persisted baseline. */
    isDirty,

    /** True while subscribing or loading. */
    isLoading,

    /** True if the asset is new (never saved). */
    isNew,

    /** True while a save is being processed. */
    isProcessing,

    /** True while the asset being edited is a secret. */
    isSecret,

    /** True if the current model passes schema validation. */
    isValid

    // The arm merges in HERE, last.
  };
}

// Type export for consumers
export type UseClientNoteManagerMeta = ReturnType<
  typeof createClientNoteManagerMeta
>;
