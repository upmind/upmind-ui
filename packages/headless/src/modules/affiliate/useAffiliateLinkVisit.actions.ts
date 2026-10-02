import type { AffiliateLinkVisitModel } from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkVisit.actions
 * @description The visit action and its `reset` (flow.md §4).
 */
export function createAffiliateLinkVisitActions(
  _actorScope: ScopeActorTypes,
  deps: {
    reset: () => void;
    visit: (overrides?: Partial<AffiliateLinkVisitModel>) => Promise<string>;
  }
) {
  return {
    /** Clears the last outcome and the failure flag, re-arming the visit. */
    reset: () => deps.reset(),

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
