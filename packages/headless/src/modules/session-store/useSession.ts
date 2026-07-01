import { createSessionActions } from "./useSession.actions";
import { createSessionContext } from "./useSession.context";
import { createSessionInternals } from "./useSession.internals";
import { createSessionMeta } from "./useSession.meta";
// -----------------------------------------------------------------------------
/**
 * @module session-store/useSession
 * @description Active session composable.
 * Provides session state, meta, and actions for the current active session.
 *
 * This is NOT a scoped composable — it always returns the active session
 * (uses SELF internally, which resolves to the current active actor).
 *
 * @example
 * ```typescript
 * const session = useSession();
 * const { isAuthenticated } = session.useMeta();
 * const { logout } = session.useActions();
 * const { session: token } = session.useContext();
 *
 * // Access raw session store via internals
 * const { storeActions } = session.useInternals();
 * storeActions.clear(); // Clear all sessions
 * ```
 */
export function useSession(sessionId: string) {
  return {
    // --- sub-composables (new API)
    /**
     * Active session actions.
     * Actions operate on the current active session.
     */
    useActions: () => createSessionActions(sessionId),

    /**
     * Active session context.
     * Returns session data for the current active session.
     */
    useContext: () => createSessionContext(sessionId),

    /**
     * Raw session store access.
     * For advanced use cases and debugging.
     */
    useInternals: () => createSessionInternals(),

    /**
     * Active session meta.
     * All flags are relative to the current active session.
     */
    useMeta: () => createSessionMeta(sessionId)
  };
}

// Type exports for consumers
export type UseSession = ReturnType<typeof useSession>;
