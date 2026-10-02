import { AccessRoleTypes } from "@upmind-automation/types";
import { useQuery } from "../query";
import { useDataLayer } from "../system-analytics";
import {
  loadUser,
  mintGuestToken,
  mintNewGuestToken
} from "./session-store.services";
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
  getLiveGuestToken,
  getTokenFromStorage,
  persistActorToStorage,
  persistTokenToStorage
} from "./session-store.utils";
import { first, isEmpty, keys, omit } from "lodash-es";
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
 * Sequence number of the most recent activation asked for.
 *
 * Activating GUEST can await a network mint, so a switch is not instantaneous:
 * "switch to guest, then back to the client" would otherwise have the resolving
 * mint write the guest pointer back over the client. The last activation asked
 * for is the one that wins.
 */
let activationSequence = 0;

/**
 * Claim the newest activation, and hand back the token that proves it.
 *
 * @returns The claimed sequence number.
 */
function claimActivation(): number {
  return ++activationSequence;
}

/**
 * Whether a claimed activation is still the newest one asked for.
 *
 * @param sequence - The number `claimActivation` handed back.
 * @returns False once a later activation has superseded it.
 */
function isActivationCurrent(sequence: number): boolean {
  return sequence === activationSequence;
}

/**
 * Set the tentative active actor and session ID. The write gate validates the
 * pointer against the session maps and re-resolves it if the requested session
 * does not exist.
 *
 * `activate(actor)` with no id (CLIENT/STAFF) means "switch to this scope": a
 * no-op when the scope is already active, else its first session; no sessions →
 * no-op. It must not stomp a specific active session back to the scope's first.
 *
 * GUEST is a session like any other here: choosing it records its id on the
 * pointer, a named pooled guest is switched to on the same terms as a client or
 * staff one, and one is minted first when no id is named and the pool holds
 * none. This is the only writer of the guest pointer — `add` deliberately is
 * not, because it cannot tell a chosen mint from a background token refresh.
 *
 * @returns A promise that resolves once the switch has settled. Never rejects:
 *   a guest mint that fails leaves the pointer where it was, and a switch a
 *   later activation supersedes resolves without writing at all.
 */
async function activateSession(
  actor: AccessRoleTypes,
  sessionId?: string
): Promise<void> {
  const sequence = claimActivation();

  if (actor === AccessRoleTypes.GUEST) {
    const { activeActor, activeSessionId, guestSessions } = store.state;

    // Already on the guest being asked for — the same predicate the resolver
    // uses to honour the pointer. Mirrors the client/staff same-scope no-op
    // below.
    if (
      activeActor === AccessRoleTypes.GUEST &&
      activeSessionId &&
      guestSessions[activeSessionId] &&
      (!sessionId || sessionId === activeSessionId)
    )
      return;

    if (!sessionId && isEmpty(guestSessions)) {
      // Soft degrade, matching `add`'s /self failure: the user keeps the
      // session they had. Not SessionState.error — that field is the fatal
      // BOOT error, not a failed mid-session switch.
      const minted = await mintGuestToken()
        .then(() => true)
        .catch(error => {
          console.warn("Failed to mint a guest session to switch to:", error);
          return false;
        });
      if (!minted) return;

      // Superseded while the mint was in flight — the newer activation owns the
      // pointer, so this one resolves without touching it. The minted guest
      // stays pooled and switchable.
      if (!isActivationCurrent(sequence)) return;
    }

    // Without an id the guest to switch to is the one the cookie names. Reading
    // the cookie rather than only the map also covers a mint that landed while
    // the store was not yet available for `add` to run: reconcile keys the entry
    // by exactly this id on the write below.
    const guestCookie = getTokenFromStorage(
      AccessRoleTypes.GUEST
    ) as IToken | null;
    const targetId =
      sessionId ??
      guestCookie?.actor_id ??
      first(keys(store.state.guestSessions));
    if (!targetId) return;

    // A named pooled guest is switched to exactly as a client or staff session
    // is — its token becomes the one the guest cookie carries (R8).
    const pooled = store.state.guestSessions[targetId]?.token;
    if (pooled && guestCookie?.actor_id !== targetId)
      persistTokenToStorage(pooled, { sync: false });

    updateSession(state => ({
      ...state,
      activeActor: AccessRoleTypes.GUEST,
      activeSessionId: targetId
    }));
    return;
  }

  if (!sessionId) {
    if (store.state.activeActor === actor) return;
    sessionId = getFirstSessionId(actor);
    if (!sessionId) return;
  }

  const record =
    actor === AccessRoleTypes.CLIENT
      ? store.state.clientSessions
      : store.state.staffSessions;
  const token = record[sessionId]?.token;
  if (token) persistTokenToStorage(token, { sync: false });

  updateSession(state => ({
    ...state,
    activeActor: actor,
    activeSessionId: sessionId
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
    const { guestSessions, clientSessions, staffSessions } = store.state;

    switch (actor) {
      case AccessRoleTypes.GUEST:
        // Unnamed, the singular guest surface means the LIVE guest, not an
        // arbitrary one of the pool (R8).
        return sessionId
          ? guestSessions[sessionId]?.token
          : getLiveGuestToken(store.state);
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
    let userLoadError: SessionState["userError"];
    // A guest has no `/self` profile in this store's model (`activeUser` is
    // null for guest, and boot's loadAllSessionUsers skips the guest map), and
    // `loadUser` would route a guest token to the CLIENT `/self` via its
    // default arm. Guest carried no id before FE-3087, so an empty `sessionId`
    // used to skip this implicitly; now that a guest session IS keyed, the
    // exemption has to be stated.
    if (
      !user &&
      sessionId &&
      token.access_token &&
      actor !== AccessRoleTypes.GUEST
    ) {
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
        // Don't throw — session is still usable without user data, and
        // background hydration/refresh must stay a soft degrade. But on an
        // INTERACTIVE login/register (`event` present) the caller is actively
        // waiting, so capture the failure for whenAuthenticated() to surface
        // rather than let it wait forever for a user that never loads.
        if (event) userLoadError = error as SessionState["userError"];
        return undefined;
      });
    }

    // Project the newly-active client/staff session to its scope cookie before
    // the write gate reconciles, so the active session is always cookie-backed.
    if (shouldActivate) persistTokenToStorage(token, { sync: false });

    updateSession(state => {
      // Update the relevant session based on actor type
      const guestSessions =
        actor === AccessRoleTypes.GUEST && sessionId
          ? {
              ...state.guestSessions,
              [sessionId]: { scope: actor, token }
            }
          : state.guestSessions;

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

      // Optionally activate this session. For GUEST only the actor is set and
      // the standing pointer is left for the write gate to re-validate —
      // omitting the key from this spread is the point, not an oversight.
      //
      // `add` cannot tell a mint driven by an explicit `activate(GUEST)` from a
      // token refresh: modules/query/query.services.ts fires
      // `persistTokenToStorage(data)` with sync enabled after a refresh_token
      // grant, for whichever session refreshed, guest included. Writing the
      // guest key here would silently promote a fallen-back guest into a chosen
      // one, and that tab would stop upgrading on a remote login. Intent
      // belongs to `activate`; `add` only records that a token exists.
      const activation = shouldActivate
        ? actor === AccessRoleTypes.GUEST
          ? { activeActor: actor }
          : { activeActor: actor, activeSessionId: sessionId }
        : {};

      // Adding a session makes the store usable — mark it ready (as `clear`
      // does) so `isReady()`/`isAuthenticated()` settle for a session
      // established before an explicit `initStore()`.
      return {
        ...state,
        clientSessions,
        guestSessions,
        initialised: true,
        staffSessions,
        ...activation,
        // Only interactive logins touch this: set it on `/self` failure, clear
        // it (undefined) on success. Non-interactive adds preserve `...state`.
        ...(event ? { userError: userLoadError } : {})
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
   * Add a NEW guest session — the guest counterpart of a fresh login.
   *
   * Mints a guest grant under its own session id, pools it beside the guests
   * already there, and makes it the active, cookie-backed guest. The guest that
   * was cookie-backed stays pooled and is reached again with
   * `activate(GUEST, id)`, exactly as a previous client is. A background token
   * refresh is the opposite request and keeps its id — only this asks for a new
   * one.
   *
   * @returns A promise resolving once the new guest is active. Never rejects: a
   *   failed mint leaves every existing session where it was, and an activation
   *   asked for while the mint is in flight wins — the new guest is still
   *   pooled and switchable, but the pointer stays where that activation put it.
   */
  async function addGuest(): Promise<void> {
    if (!isScopeAllowed(AccessRoleTypes.GUEST)) return;

    const sequence = claimActivation();

    return mintNewGuestToken()
      .then(token => {
        if (!isActivationCurrent(sequence)) return;
        return activateSession(
          AccessRoleTypes.GUEST,
          token.actor_id || undefined
        );
      })
      .catch(error => {
        console.warn("Failed to mint a new guest session:", error);
      });
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
   * Remove one session from the store — guest on the same terms as client and
   * staff: the named entry is dropped from its own map and every sibling in
   * that map is left alone.
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
      targetId === store.state.activeSessionId;
    const parentId = targetId
      ? store.state.impersonatedSessions[targetId]
      : undefined;

    // Restoring the parent makes it the active session — regenerate its scope
    // cookie so the write gate does not read it as externally deleted.
    if (isActive && parentId) {
      const parentToken =
        store.state.staffSessions[parentId]?.token ??
        store.state.clientSessions[parentId]?.token;
      if (parentToken) persistTokenToStorage(parentToken, { sync: false });
    }

    // Remove the session and clean up its impersonation entry. When the removed
    // session was active, set a tentative pointer to the parent (impersonation
    // policy); the gate validates it (parent exists? keep : fall through).
    updateSession(state => {
      const clientSessions: Record<string, SessionEntry> =
        actor === AccessRoleTypes.CLIENT && targetId
          ? omit(state.clientSessions, targetId)
          : state.clientSessions;
      const guestSessions: Record<string, SessionEntry> =
        actor === AccessRoleTypes.GUEST && targetId
          ? omit(state.guestSessions, targetId)
          : state.guestSessions;
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
        guestSessions,
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
   *
   * @param actor - The actor type to switch to
   * @param sessionId - The session to switch to; defaults to that scope's first
   *   session (for GUEST, the one its cookie names)
   * @returns A promise resolving once the switch has settled. Activating GUEST
   *   with no id mints a session when the pool holds none, so this can involve a
   *   network call; a failed mint resolves WITHOUT moving the pointer. Never
   *   rejects.
   */
  async function activate(
    actor: AccessRoleTypes,
    sessionId?: string
  ): Promise<void> {
    if (!isScopeAllowed(actor)) return;
    return activateSession(actor, sessionId);
  }

  function clear(): void {
    updateSession(() => ({
      activeActor: AccessRoleTypes.GUEST,
      activeSessionId: undefined,
      clientSessions: {},
      guestSessions: {},
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

    /**
     * Add a NEW guest session and make it active; the previous guest stays
     * pooled and switchable.
     */
    addGuest,

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
     * Remove one session from state, leaving its siblings in place.
     * If removing active session, handles impersonation restoration.
     * Use logout() for full removal including cookies.
     * @param actor - GUEST, CLIENT or STAFF
     * @param sessionId - The session id to remove
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
