import type { AffiliateReferralsListQuery } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateReferrals.internals
 * @description Collection internals (debugging).
 */
export function createAffiliateReferralsInternals(
  actorScope: ScopeActorTypes,
  query: AffiliateReferralsListQuery
) {
  return {
    actorScope,
    query
  };
}
