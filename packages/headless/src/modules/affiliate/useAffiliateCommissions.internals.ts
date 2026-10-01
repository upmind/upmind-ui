import type { AffiliateCommissionsListQuery } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateCommissions.internals
 * @description Collection internals (debugging).
 */
export function createAffiliateCommissionsInternals(
  actorScope: ScopeActorTypes,
  query: AffiliateCommissionsListQuery
) {
  return {
    actorScope,
    query
  };
}
