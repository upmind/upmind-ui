import { computed } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { contextValue, stateMatches } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { BillingSettingsContext } from "./client-billing-settings.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings.meta
 * @description Manager meta — FLAT computeds, one per flag, read through the
 * canonical state utilities only.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createBillingSettingsMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  /**
   * `true` only when the brand has explicitly opted clients into managing
   * their own consolidation preference (row O8, AC-17). Read through the brand
   * module's `getConfigValue` — `loadBrandGates` runs `ensureConfig` in the
   * services, so the nested key is settled by the time the meta reads it.
   * Visible only on an explicit literal `false`; an absent or `true` value
   * restricts the surface.
   */
  const isVisible = computed(
    () =>
      useBrand().getConfigValue<boolean>(
        BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF
      ) === false
  );

  /**
   * `true` only when the brand has explicitly opted clients into paying in a
   * different currency (row B6). OPPOSITE polarity to `isVisible` — consumed
   * as `!!value`, never sharing a default with it.
   */
  const hasPaymentCurrencyChoice = computed(
    () =>
      !!useBrand().getConfigValue<boolean>(
        BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED
      )
  );

  /**
   * True once the form is available for input — the machine is settled AND
   * the brand has opted this client into managing consolidation (AC-17). A
   * restricted client reads `false`, and the editor makes no write.
   */
  const isAvailable = computed(
    () => stateMatches(state, "available") && isVisible.value
  );

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

    /** True while subscribing or loading. */
    isLoading,

    /** True while a save is being processed. */
    isProcessing,

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
export type UseBillingSettingsMeta = ReturnType<
  typeof createBillingSettingsMeta
>;
