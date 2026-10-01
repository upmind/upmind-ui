import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateActiveAccount.actions
 * @description Account-source actions — a read-only surface, R-NO-SWITCH.
 * `destroy()` lives in `.internals`, never here (consumer obligation 8).
 */
export function createAffiliateActiveAccountActions(
  _actorScope: ScopeActorTypes,
  deps: {
    isReady: () => Promise<boolean>;
  }
) {
  return {
    // --- methods
    /** Resolves on any terminal state (design.md §8.4). It never rejects. */
    isReady: () => deps.isReady()
  };
}

export type UseAffiliateActiveAccountActions = ReturnType<
  typeof createAffiliateActiveAccountActions
>;
