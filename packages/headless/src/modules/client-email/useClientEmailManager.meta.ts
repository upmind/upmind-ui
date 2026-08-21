import { computed } from "vue";
import { contextValue, stateMatches, stateValue } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { EmailContext } from "./client-email.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.meta
 * @description Manager meta — FLAT computeds, one per flag, read through the
 * canonical state utilities only.
 *
 * A consumer porting off the pre-scope manager reads `useMeta().isValid` where
 * it used to read `meta.value.isValid`: the single `meta` object is gone.
 */
export function createClientEmailManagerMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  /** True once the form is available for input. */
  const isAvailable = computed(() => stateMatches(state, "available"));

  /**
   * True while the machine is waiting for its client id or resolving lookups.
   * `subscribing` is included deliberately: a manager whose `hasSubscription`
   * guard has not passed yet is loading, not broken.
   */
  const isLoading = computed(() =>
    stateMatches(state, ["subscribing", "loading"])
  );

  /** True if the machine captured an error. */
  const hasErrors = computed(
    () =>
      stateMatches(state, "available.error") ||
      !isEmpty(contextValue<EmailContext["error"]>(state, "error"))
  );

  /** True if the current model passes schema validation. */
  const isValid = computed(() => stateMatches(state, "available.valid"));

  /** True if the model differs from its persisted baseline. */
  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<EmailContext["model"]>(state, "model"),
        contextValue<EmailContext["baseModel"]>(state, "baseModel")
      )
  );

  /**
   * True if the address is new. Reads the context `id` the machine's own
   * `isNew` guard reads (`({ id }) => !id`), not a `stateMatches` call against
   * a context path — which can only ever return false.
   */
  const isNew = computed(() => !contextValue<EmailContext["id"]>(state, "id"));

  /** True while a save is being processed. */
  const isProcessing = computed(() => stateMatches(state, "processing"));

  /** True once the address has been saved. */
  const isComplete = computed(
    () =>
      stateValue<boolean>(state, "done", false) === true ||
      stateMatches(state, ["processed", "complete"])
  );

  return {
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

export type UseClientEmailManagerMeta = ReturnType<
  typeof createClientEmailManagerMeta
>;
