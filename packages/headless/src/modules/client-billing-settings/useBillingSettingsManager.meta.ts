import { computed } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { contextValue, stateMatches } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { BillingSettingsContext } from "./client-billing-settings.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettingsManager.meta
 * @description Manager meta — FLAT computeds, one per flag, read through the
 * canonical state utilities only.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createBillingSettingsManagerMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  consumerDisabled: Ref<boolean>
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
      !isEmpty(contextValue<BillingSettingsContext["error"]>(state, "error"))
  );

  /** True if a validation error exists AND the form has been touched. */
  const showErrors = computed(
    () =>
      !isEmpty(contextValue<BillingSettingsContext["error"]>(state, "error")) &&
      stateMatches(state, ["available.invalid", "available.error"])
  );

  /** True if the current model passes schema validation. */
  const isValid = computed(() => stateMatches(state, "available.valid"));

  /** True if the model differs from its persisted baseline. */
  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<BillingSettingsContext["model"]>(state, "model"),
        contextValue<BillingSettingsContext["baseModel"]>(state, "baseModel")
      )
  );

  /** True while a save is being processed. */
  const isProcessing = computed(() => stateMatches(state, "processing"));

  /** True once the preference has been saved. */
  const isComplete = computed(() =>
    stateMatches(state, ["processed", "complete"])
  );

  /** `true` while the addressed client record is a staged, unprocessed import (row C14). */
  const isStaged = computed(
    () => !!contextValue<boolean[]>(state, "lookups.isStaged")?.[0]
  );

  /**
   * `true` only when the brand has explicitly opted clients into this
   * surface (row O8). Reads the whole `config` bag and indexes by the
   * enum member directly — `BrandConfigKeys` values are themselves dotted
   * strings, so a dotted `contextValue` path string would misparse the key
   * into nested segments rather than one atomic key.
   */
  const isVisible = computed(
    () =>
      contextValue<Record<BrandConfigKeys, boolean>>(state, "config")?.[
        BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF
      ] === false
  );

  /**
   * `true` only when the brand has explicitly opted clients into paying in a
   * different currency (row B6). OPPOSITE polarity to `isVisible` above —
   * consumed as `!!value`, never sharing a helper or default with it.
   */
  const hasPaymentCurrencyChoice = computed(
    () =>
      !!contextValue<Record<BrandConfigKeys, boolean>>(state, "config")?.[
        BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED
      ]
  );

  /**
   * `true` only when every one of this module's own gates allows editing —
   * not staged (row C14), not mid-save, and not externally locked by the
   * consumer (row C16, `setDisabled()`). Folded here rather than left for
   * each consumer to reconstruct from the flags individually.
   */
  const isEditable = computed(
    () => !isStaged.value && !isProcessing.value && !consumerDisabled.value
  );

  // --- actor-specific meta: none earned (arms: none — parity.yaml).

  return {
    /** True if the machine captured an error. */
    hasErrors,

    /** True once the form is available for input. */
    isAvailable,

    /** True once the preference has been saved. */
    isComplete,

    /** True if the model differs from its persisted baseline. */
    isDirty,

    /**
     * True only when every one of this module's own gates allows editing —
     * not staged, not mid-save, not consumer-locked (row C16).
     */
    isEditable,

    /** True while subscribing or loading. */
    isLoading,

    /** True while a save is being processed. */
    isProcessing,

    /** `true` while the addressed client record is a staged, unprocessed import (row C14). */
    isStaged,

    /** True if the current model passes schema validation. */
    isValid,

    /** `true` only when the brand has explicitly opted clients into this surface (row O8). */
    isVisible,

    /** `true` only when the brand has explicitly opted clients into paying in a different currency (row B6). */
    hasPaymentCurrencyChoice,

    /** True if an error exists and the form has been touched. */
    showErrors

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseBillingSettingsManagerMeta = ReturnType<
  typeof createBillingSettingsManagerMeta
>;
