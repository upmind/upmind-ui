import { AccessRoleTypes } from "@upmind-automation/types";
import { loadUser } from "./session-store.services";
import { useDataLayer } from "../system-analytics";
import { useQuery } from "../query";
import {
  sessionStore as store,
  isScopeAllowed,
  hydrateFromStorage,
  updateSession
} from "./session-store.store";
import {
  broadcastSessionChange,
  subscribeToLogout
} from "./session-store.sync";
import { AuthEvents, SessionEvents } from "./session-store.types";
import {
  dumpTokenFromStorage,
  getExpiresAt,
  getFirstSessionId,
  persistActorToStorage
} from "./session-store.utils";
import { omit } from "lodash-es";
import type {
  AuthEventType,
  SessionEntry,
  SessionState,
  SessionUser
} from "./session-store.types";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module session-store/useSessionStoreActions
 * @description Session store actions sub-composable.
 */

// --- Private Helpers

/**
 * Set the tentative active actor and session ID. The write gate validates the
 * pointer against the session maps and falls through to the GUEST floor if the
 * requested session does not exist.
 */
function activateSession(actor: AccessRoleTypes, sessionId?: string): void {
  updateSession(state => ({
    ...state,
    activeActor: actor,
    activeSessionId: actor === AccessRoleTypes.GUEST ? undefined : sessionId
  }));
}

// -----------------------------------------------------------------------------
// Public Actions

/**
 * Sub-composable for session store mutations.
 *
 * @example
 * ```ts
 * import { useSessionStoreActions } from '@upmind/headless'
 *
 * const { add, activate, remove, clear } = useSessionStoreActions()
 * ```
 */
export function useSessionStoreActions() {
  /**
   * Get the session token for a specific actor type.
   * Returns undefined if no session exists for that actor.
   *
   * @param actor - The actor type to look up
   * @param sessionId - The session ID to look up (defaults to first for that actor)
   * @returns The token or undefined
   */
  const get = (
    actor: AccessRoleTypes,
    sessionId?: string
  ): IToken | undefined => {
    const targetId = sessionId ?? getFirstSessionId(actor);
    const { guestSession, clientSessions, staffSessions } = store.state;

    switch (actor) {
      case AccessRoleTypes.GUEST:
        return guestSession;
      case AccessRoleTypes.CLIENT:
        return targetId ? clientSessions[targetId]?.token : undefined;
      case AccessRoleTypes.STAFF:
        return targetId ? staffSessions[targetId]?.token : undefined;
      default:
        return undefined;
    }
  };

  /**
   * Add a session to the store.
   * Stores token based on actor_type and optionally activates it.
   * If user data is not provided, it will be loaded asynchronously in the background.
   *
   * @param token - The session token to store
   * @param shouldActivate - Whether to set this as the active session (default: true)
   * @param user - Optional user profile data for display
   */
  async function add(
    token: IToken,
    shouldActivate: boolean = true,
    user?: SessionUser,
    event?: AuthEventType
  ): Promise<void> {
    const actor = token.actor_type as AccessRoleTypes;
    const sessionId = token.actor_id;

    // Guard: don't activate sessions for excluded scopes (still store them)
    if (!isScopeAllowed(actor)) shouldActivate = false;

    // NEW: If user data not provided, load it asynchronously
    if (!user && sessionId && token.access_token) {
      // Login must reflect server truth — bust the 24h-cached /self so a change
      // made elsewhere (e.g. a freshly verified email) is seen, not the stale
      // snapshot. Register mints a new actor (never cached); refresh/hydration keep it.
      if (event === AuthEvents.LOGIN) {
        const { queryClient } = useQuery();
        await queryClient.invalidateQueries({
          queryKey: ["session", actor, sessionId]
        });
      }
      // Load user data if we dont have it
      user = await loadUser(token).catch(error => {
        console.warn(
          `Failed to load user data for ${actor} session ${sessionId}:`,
          error
        );
        return undefined;
        // Don't throw - session is still usable without user data
      });
    }

    updateSession(state => {
      // Update the relevant session based on actor type
      const guestSession =
        actor === AccessRoleTypes.GUEST ? token : state.guestSession;

      const clientSessions =
        actor === AccessRoleTypes.CLIENT
          ? {
              ...state.clientSessions,
              [sessionId!]: { scope: actor, token, user }
            }
          : state.clientSessions;

      const staffSessions =
        actor === AccessRoleTypes.STAFF
          ? {
              ...state.staffSessions,
              [sessionId!]: { scope: actor, token, user }
            }
          : state.staffSessions;

      // Optionally activate this session
      const activation = shouldActivate
        ? {
            activeActor: actor,
            activeSessionId:
              actor === AccessRoleTypes.GUEST ? undefined : sessionId
          }
        : {};

      return {
        ...state,
        clientSessions,
        guestSession,
        staffSessions,
        ...activation
      };
    });

    // Actor analytics: mirror /self analytics into the upm_actor cookie and
    // fire the login/sign_up dataLayer event for this authentication. Both are
    // gated on resolved analytics — a /self failure must not fire a login event
    // that withUser() would stamp logged_in:false on a successful auth.
    if (user?.analytics) {
      persistActorToStorage(user.analytics);
      if (event) useDataLayer().dataLayer({ event }).withUser().push(false);
    }

    broadcastSessionChange({ type: "SET_SESSION", session: token });
  }

  /**
   * Register an impersonation relationship.
   * Call this BEFORE adding the new session so it can capture the current active session as impersonator.
   *
   * @param impersonatedSessionId - The session ID of the actor being impersonated
   */
  function registerImpersonation(impersonatedSessionId: string): void {
    if (!impersonatedSessionId) return;
    const impersonatorSessionId = store.state.activeSessionId;
    if (!impersonatorSessionId) return;

    updateSession(state => {
      const newImpersonations = {
        ...state.impersonatedSessions,
        [impersonatedSessionId]: impersonatorSessionId
      };
      return {
        ...state,
        impersonatedSessions: newImpersonations
      };
    });

    broadcastSessionChange({
      type: "IMPERSONATION_REGISTERED",
      impersonatedSessionId,
      impersonatorSessionId
    });
  }

  /**
   * Remove a session from the store.
   * If removing the active session, restores parent (impersonation) or next available.
   *
   * @param actor - The actor type to remove
   * @param sessionId - The session ID to remove (defaults to first for that actor)
   */
  function remove(actor: AccessRoleTypes, sessionId?: string): void {
    const targetId = sessionId ?? getFirstSessionId(actor);

    // Capture state before mutation
    const isActive =
      actor === store.state.activeActor &&
      (actor === AccessRoleTypes.GUEST ||
        targetId === store.state.activeSessionId);
    const parentId = targetId
      ? store.state.impersonatedSessions[targetId]
      : undefined;

    // Remove the session and clean up its impersonation entry. When the removed
    // session was active, set a tentative pointer to the parent (impersonation
    // policy); the gate validates it (parent exists? keep : fall through).
    updateSession(state => {
      const clientSessions: Record<string, SessionEntry> =
        actor === AccessRoleTypes.CLIENT && targetId
          ? omit(state.clientSessions, targetId)
          : state.clientSessions;
      const staffSessions: Record<string, SessionEntry> =
        actor === AccessRoleTypes.STAFF && targetId
          ? omit(state.staffSessions, targetId)
          : state.staffSessions;

      let tentative: Partial<SessionState> = {};
      if (isActive && parentId) {
        if (staffSessions[parentId])
          tentative = {
            activeActor: AccessRoleTypes.STAFF,
            activeSessionId: parentId
          };
        else if (clientSessions[parentId])
          tentative = {
            activeActor: AccessRoleTypes.CLIENT,
            activeSessionId: parentId
          };
      }

      return {
        ...state,
        guestSession:
          actor === AccessRoleTypes.GUEST ? undefined : state.guestSession,
        clientSessions,
        staffSessions,
        impersonatedSessions: targetId
          ? omit(state.impersonatedSessions, targetId)
          : state.impersonatedSessions,
        ...tentative
      };
    });

    broadcastSessionChange({
      type: "REMOVE_SESSION",
      actor,
      sessionId: targetId ?? ""
    });
  }

  /**
   * Activate a specific actor and session.
   * No-op if the actor scope is not allowed by the store config.
   */
  function activate(actor: AccessRoleTypes, sessionId?: string): void {
    if (!isScopeAllowed(actor)) return;
    activateSession(actor, sessionId);
  }

  function clear(): void {
    updateSession(() => ({
      activeActor: AccessRoleTypes.GUEST,
      activeSessionId: undefined,
      clientSessions: {},
      guestSession: undefined,
      impersonatedSessions: {},
      staffSessions: {},
      initialised: true,
      loading: false
    }));

    broadcastSessionChange({ type: "CLEAR" });
  }

  /**
   * Log out of a session. Removes the cookie and state for the specified actor.
   * Session restoration (impersonation or fallback) is handled by remove().
   *
   * @param actor - Actor type to log out (defaults to activeActor)
   *
   * @example
   * // Log out active session
   * logout();
   *
   * // Staff acting as client - log out of client only
   * logout(AccessRoleTypes.CLIENT);
   *
   * // Log out of staff session
   * logout(AccessRoleTypes.STAFF);
   */
  function logout(actor?: AccessRoleTypes): void {
    const targetActor = actor ?? store.state.activeActor;

    // dumpTokenFromStorage is source of truth - handles cookie removal
    // and calls remove() which handles state removal + session restoration
    dumpTokenFromStorage(targetActor);

    broadcastSessionChange({
      type: SessionEvents.UNAUTHENTICATED,
      actor: targetActor
    });
  }

  /**
   * Wait for store initialization to complete.
   * Returns immediately if already initialised.
   * Uses store.subscribe() to react to state changes without polling.
   *
   * @returns Promise<boolean> - Resolves to true when initialised
   *
   * @example
   * ```ts
   * const { isReady } = useSessionStore().useActions();
   *
   * // Wait for initialization
   * const ready = await isReady();
   *
   * if (ready) {
   *   // Now store is ready with loaded sessions and user data
   *   const { activeSession } = useSessionStore().useContext();
   * }
   * ```
   */
  async function isReady(): Promise<boolean> {
    // Already initialised - return immediately
    if (store.state.initialised) {
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      const unsubscribe = store.subscribe(() => {
        if (store.state.initialised) {
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Update user data for an existing session without refetching.
   * Used after operations that return updated user data (e.g. completeRegistration).
   *
   * @param actor - The actor type
   * @param sessionId - The session ID to update
   * @param user - The updated user data
   */
  function updateUser(
    actor: AccessRoleTypes,
    sessionId: string,
    user: SessionUser
  ): void {
    updateSession(state => {
      if (actor === AccessRoleTypes.CLIENT && state.clientSessions[sessionId]) {
        return {
          ...state,
          clientSessions: {
            ...state.clientSessions,
            [sessionId]: { ...state.clientSessions[sessionId], user }
          }
        };
      }
      if (actor === AccessRoleTypes.STAFF && state.staffSessions[sessionId]) {
        return {
          ...state,
          staffSessions: {
            ...state.staffSessions,
            [sessionId]: { ...state.staffSessions[sessionId], user }
          }
        };
      }
      return state;
    });
  }

  return {
    /**
     * Set the active actor type and session.
     * @param actor - The actor type
     * @param sessionId - Optional actor_id
     */
    activate,

    /**
     * Get a session from the store.
     * @param actor - The actor type
     */
    get,

    /**
     * Add a session to the store.
     * @param token - Token with actor_id
     * @param shouldActivate - Whether to set as active (default: true)
     */
    add,

    /** Clear all sessions and reset to guest. */
    clear,

    /**
     * Get the expiration time of a token.
     */
    getExpiresAt,

    /**
     * Re-hydrate the session store from sessionStorage + cookies.
     * Used to refresh /self after operations like email verification
     * that mutate server-side user state.
     */
    refresh: hydrateFromStorage,

    /**
     * Wait for store initialization to complete.
     * @returns Promise<boolean> - Resolves to true when initialised
     */
    isReady,

    /**
     * Log out of a session.
     * Removes cookie and state, restores parent if impersonating.
     * @param actor - Actor type to log out (defaults to activeActor)
     */
    logout,

    /**
     * Subscribe to logout events.
     * @param callback - Called with actor type when logout occurs
     * @returns Unsubscribe function
     */
    onLogout: subscribeToLogout,

    /**
     * Register an impersonation relationship.
     * Call BEFORE adding the new session - captures current active as impersonator.
     * @param impersonatedSessionId - The new session's ID
     */
    registerImpersonation,

    /**
     * Remove a client or staff session from state.
     * If removing active session, handles impersonation restoration.
     * Use logout() for full removal including cookies.
     * @param actor - CLIENT or STAFF
     * @param sessionId - The actor_id to remove
     */
    remove,

    /**
     * Update user data for an existing session without refetching.
     * @param actor - The actor type
     * @param sessionId - The session ID
     * @param user - The updated user data
     */
    updateUser
  };
}

export type UseSessionStoreActions = ReturnType<typeof useSessionStoreActions>;
