import type { ScopeActorTypes } from "../scope/scope.types";
import type { IAffiliate } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useClientAffiliate.internals
 * @description Diagnostics only.
 */
export function createClientAffiliateInternals(
  _actorScope: ScopeActorTypes,
  deps: {
    accountId: ComputedRef<string | undefined>;
    data: ComputedRef<IAffiliate | undefined>;
    isClientActor: ComputedRef<boolean>;
  }
) {
  return {
    accountId: deps.accountId,
    data: deps.data,
    isClientActor: deps.isClientActor
  };
}
