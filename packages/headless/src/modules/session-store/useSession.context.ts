import { computed } from "vue";
import { useSessionStore } from ".";
// -----------------------------------------------------------------------------
/**
 * @module session-store/useSession.context
 * @description Scope-aware session context sub-composable.
 * Delegates to useSessionStoreContext for reactive store access,
 * then computes scope-aware values from the store data.
 */

/**
 * Factory for scope-aware session context.
 * Returns session data relative to the specified actor scope.
 *
 * @returns Scope-aware context computed refs
 */
export function createSessionContext(_sessionId?: string) {
  const storeCtx = useSessionStore().useContext();

  return {
    /** User profile for the active session. */
    activeUser: storeCtx.activeUser,

    /** The resolved actor type for this scope. */
    actor: storeCtx.activeActor,

    /**
     * Object ids delegated to this session's client, keyed by object type.
     * `{}` for staff and guest, and for a session persisted before the field
     * existed (see the `@decision` on `hasDelegatedProducts`).
     */
    delegatedIds: computed(() => storeCtx.activeUser.value?.delegatedIds ?? {}),

    /** Computed expiration timestamp for this scope's session (Unix epoch in ms). */
    expiresAt: storeCtx.expiresAt,

    /** The session token for THIS scope. */
    session: storeCtx.activeSession,

    /** The session ID (actor_id) for THIS scope. Null for guest. */
    sessionId: storeCtx.activeSessionId
  };
}

// Type export for consumers
export type UseActiveSessionContext = ReturnType<typeof createSessionContext>;
