import type { AffiliatePayoutsListQuery } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayouts.internals
 * @description Collection internals (debugging).
 */
export function createAffiliatePayoutsInternals(
  actorScope: ScopeActorTypes,
  query: AffiliatePayoutsListQuery
) {
  return {
    actorScope,
    query
  };
}
