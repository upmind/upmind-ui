import { computed } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IAffiliate, IAffiliateBalance } from "@upmind-automation/types";
import type { ComputedRef, Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useClientAffiliate.meta
 * @description Derived state flags for the account read (design.md §8.5).
 */
export function createClientAffiliateMeta(
  _actorScope: ScopeActorTypes,
  deps: {
    accountId: ComputedRef<string | undefined>;
    areaSettings: Ref<Record<string, unknown>>;
    balances: ComputedRef<IAffiliateBalance | undefined>;
    data: ComputedRef<IAffiliate | undefined>;
    gateSettings: Ref<Record<string, unknown>>;
    hasError: ComputedRef<boolean>;
    isEnrolled: ComputedRef<boolean>;
    isLoading: ComputedRef<boolean>;
    isProcessing: Ref<boolean>;
  }
) {
  const isAvailable = computed(() => !!deps.accountId.value);
  const isComplete = computed(() => !deps.isLoading.value && isAvailable.value);
  const isEmptyState = computed(() => !deps.data.value);

  // Bracket access, never a dotted/underscored property path — the wire's
  // own keys ARE the literal dotted `BrandConfigKeys` strings, flat
  // (client-billing-settings.services.ts's `loadBrandGates`).
  const isProgrammeEnabled = computed(
    () =>
      !!deps.gateSettings.value[BrandConfigKeys.UPMIND_AFFILIATES_ENABLED] &&
      !!deps.gateSettings.value[
        BrandConfigKeys.UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED
      ]
  );

  const isDisabled = computed(() => !!deps.data.value?.disabled);
  const isStaged = computed(() => !!deps.data.value?.staged_import);

  const hasPayableCommissions = computed(
    () => !!deps.balances.value?.balance?.ALL?.amount
  );

  const canWithdraw = computed(
    () =>
      !!deps.areaSettings.value[BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST] &&
      hasPayableCommissions.value
  );

  return {
    hasError: deps.hasError,
    isAvailable,
    isComplete,
    isEmpty: isEmptyState,
    isLoading: deps.isLoading,
    isProcessing: deps.isProcessing,
    isProgrammeEnabled,

    /** The active account id AND non-empty account data (design.md §8.5, `o36`). */
    isEnrolled: deps.isEnrolled,
    isDisabled,
    isStaged,
    canWithdraw,
    hasPayableCommissions,

    balanceAvailable: computed(
      () => deps.balances.value?.balance?.ALL?.amount_formatted ?? ""
    ),
    balancePending: computed(
      () => deps.balances.value?.pending_balance?.ALL?.amount_formatted ?? ""
    ),
    balanceWithdrawn: computed(
      () => deps.balances.value?.withdrawn_balance?.ALL?.amount_formatted ?? ""
    ),

    affiliateSince: computed(() => deps.data.value?.created_at),
    linkVisitCount: computed(() => deps.data.value?.link_visit_count ?? 0),
    referralCount: computed(() => deps.data.value?.referral_count ?? 0)
  };
}
