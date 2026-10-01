import { useActiveSession } from "../session-store";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateActiveAccount.internals
 * @description Diagnostics and `destroy()` — the test-only teardown door
 * (design.md §8.4, R-NO-SWITCH). A consumer never calls `destroy()`
 * (consumer obligation 8).
 */
export function createAffiliateActiveAccountInternals(
  _actorScope: ScopeActorTypes,
  deps: {
    destroy: () => void;
  }
) {
  const session = useActiveSession().useContext();

  return {
    /** The session actor's id, for diagnostics. */
    sessionId: session.sessionId,

    /**
     * Test-teardown only. Stops the shared effect scope, removes each
     * subscription, and resets the value of each published ref in place —
     * it never replaces a ref.
     */
    destroy: deps.destroy
  };
}

export type UseAffiliateActiveAccountInternals = ReturnType<
  typeof createAffiliateActiveAccountInternals
>;
