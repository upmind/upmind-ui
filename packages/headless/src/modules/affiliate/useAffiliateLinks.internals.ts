import type { AffiliateLinksListQuery } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinks.internals
 * @description Collection internals (debugging).
 */
export function createAffiliateLinksInternals(
  actorScope: ScopeActorTypes,
  query: AffiliateLinksListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}
