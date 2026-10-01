import { computed } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import {
  useWithdrawalSchema,
  useWithdrawalUischema,
  withdrawalDefaults
} from "./affiliate.schemas";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type {
  IAffiliate,
  IAffiliateBalance,
  IBrand
} from "@upmind-automation/types";
import type { ComputedRef, Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useClientAffiliate.context
 * @description The account, its balances and the withdrawal form contract
 * (design.md §8.5).
 *
 * @decision this factory's return type is not re-exported under a type
 * alias, unlike this codebase's usual "type export for consumers" line.
 * what: no exported type alias for this factory's return type. Same for the
 *      sibling `.meta.ts`, `.actions.ts` and `.internals.ts` files of this
 *      composable.
 * why: the portal mock this module replaces (design.md §1.3,
 *      `apps/portal-nuxt/app/portal/mock/contracts/client-affiliate.ts`)
 *      already exports the identically-named type the codebase convention
 *      would mint here; the duplicate-type gate denies a second
 *      declaration of it.
 * rejected: renaming the export instead — rejected, because the module
 *      barrel would then have to re-export it under a name no other
 *      composable's layer file uses, breaking the "Type export for
 *      consumers" convention for every consumer, not only the collision.
 */
export function createClientAffiliateContext(
  _actorScope: ScopeActorTypes,
  deps: {
    areaSettings: Ref<Record<string, unknown>>;
    balances: ComputedRef<IAffiliateBalance | undefined>;
    brand: ComputedRef<IBrand | undefined>;
    data: ComputedRef<IAffiliate | undefined>;
    error: ComputedRef<ResponseError | undefined>;
    gateSettings: Ref<Record<string, unknown>>;
    referralOriginValue: ComputedRef<string>;
  }
) {
  // Bracket access, never a dotted/underscored property path — the wire's
  // own keys ARE the literal dotted `BrandConfigKeys` strings, flat
  // (client-billing-settings.services.ts's `loadBrandGates`).
  const defaultRedirectUrl = computed(
    () =>
      (deps.areaSettings.value[
        BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK
      ] as string | undefined) ?? ""
  );

  const balanceAvailable = computed(
    () => deps.balances.value?.balance?.ALL?.amount_formatted ?? ""
  );

  return {
    /** The affiliate account read, as-is. */
    data: deps.data,

    /** The balance read, as-is. */
    balances: deps.balances,

    /** `data.account.brand`, else the client brand of the self read (design.md D-24). */
    brand: deps.brand,

    /** The origin of the brand's `default` oauth client, or `""` (D-31). */
    referralOrigin: deps.referralOriginValue,

    /** The last write or load failure, else `undefined`. */
    error: deps.error,

    /** `AFFILIATES_DEFAULT_REDIRECT_LINK`, `""` when absent. */
    defaultRedirectUrl,

    /** The withdrawal form contract (design.md §8.5, `m3`). */
    withdrawal: {
      schema: useWithdrawalSchema(),
      uischema: useWithdrawalUischema(),
      defaults: computed(() =>
        withdrawalDefaults({ amount: balanceAvailable.value })
      )
    }
  };
}
