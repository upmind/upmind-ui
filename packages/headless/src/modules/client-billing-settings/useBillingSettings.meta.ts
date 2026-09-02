import { computed } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import type {
  ClientBillingSettingsRecordQuery,
  ClientBillingSettingsServices
} from "./client-billing-settings.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings.meta
 * @description Read meta — computed state flags, one computed per flag.
 * @doctrine clause 2 — shared-only (armless). No capability read-state
 * exists in this module, so `meta` legitimately stays shared-only rather
 * than needing a per-actor capability arm.
 */
export function createBillingSettingsMeta(
  _actorScope: ScopeActorTypes,
  service: ClientBillingSettingsServices,
  query: ClientBillingSettingsRecordQuery
) {
  useBrand().ensureConfig(
    BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF
  );

  const hasErrors = computed(() => !!query.error.value);

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  /**
   * Row O8 — hidden unless the brand explicitly opts clients in. The `?? true`
   * polarity is the oracle's own (`comp:72-79`): an absent or `true` value
   * hides the surface; only an explicit literal `false` reveals it.
   */
  const isVisible = computed(
    () =>
      useBrand().getConfigValue<boolean>(
        BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF
      ) === false
  );

  // --- actor-specific meta: none earned (arms: none — parity.yaml).

  return {
    /** True if the preference read failed. */
    hasErrors,

    /**
     * True while this scope can address a client — authenticated with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gate calls.
     */
    isAvailable: service.isAvailable,

    /** True while the read is loading or has not completed its first fetch. */
    isLoading,

    /** True only when the brand has explicitly opted clients into this surface (row O8). */
    isVisible

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseBillingSettingsMeta = ReturnType<
  typeof createBillingSettingsMeta
>;
