import type { AffiliateLinkVisitModel } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkVisit.actions
 * @description The one action this composable exposes (flow.md §4).
 */
export function createAffiliateLinkVisitActions(
  _actorScope: ScopeActorTypes,
  deps: {
    visit: (overrides?: Partial<AffiliateLinkVisitModel>) => Promise<string>;
  }
) {
  return {
    /**
     * Records the visit, writes or deletes the `upm_aff` cookie, and
     * resolves the redirect target. Never rejects (flow.md §4).
     */
    visit: (overrides?: Partial<AffiliateLinkVisitModel>) =>
      deps.visit(overrides)
  };
}

export type UseAffiliateLinkVisitActions = ReturnType<
  typeof createAffiliateLinkVisitActions
>;
