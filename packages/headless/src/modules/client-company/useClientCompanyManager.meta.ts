import { computed } from "vue";
import { contextValue, stateMatches, stateValue } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { CompanyContext } from "./client-company.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanyManager.meta
 * @description Manager meta — FLAT computeds, one per flag, read through the
 * canonical state utilities only.
 *
 * `hasErrors` (plural) is deliberate, not a naming slip against the
 * collection's `hasError` — both are KEPT as-is: they are on the published
 * surface and renaming either is a breaking change with no capability
 * behind it (`parity.yaml` C28).
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCompanyManagerMeta(
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
      !isEmpty(contextValue<CompanyContext["error"]>(state, "error"))
  );

  /** True if the current model passes schema validation. */
  const isValid = computed(() => stateMatches(state, "available.valid"));

  /** True if the model differs from its persisted baseline. */
  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<CompanyContext["model"]>(state, "model"),
        contextValue<CompanyContext["baseModel"]>(state, "baseModel")
      )
  );

  /**
   * True if the company is new. Reads the context `id` the machine's own
   * `isNew` guard reads (`({ id }) => !id`), not a `stateMatches` call
   * against a context path — which can only ever return false.
   */
  const isNew = computed(
    () => !contextValue<CompanyContext["id"]>(state, "id")
  );

  /** True while a save is being processed. */
  const isProcessing = computed(() => stateMatches(state, "processing"));

  /** True once the company has been saved. */
  const isComplete = computed(
    () =>
      stateValue<boolean>(state, "done", false) === true ||
      stateMatches(state, ["processed", "complete"])
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientCompanyManager.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the machine captured an error. */
    hasErrors,

    /** True once the form is available for input. */
    isAvailable,

    /** True once the company has been saved. */
    isComplete,

    /** True if the model differs from its persisted baseline. */
    isDirty,

    /** True while subscribing or loading. */
    isLoading,

    /** True if the company is new (never saved). */
    isNew,

    /** True while a save is being processed. */
    isProcessing,

    /** True if the current model passes schema validation. */
    isValid

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientCompanyManagerMeta = ReturnType<
  typeof createClientCompanyManagerMeta
>;
