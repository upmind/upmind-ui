import { ref } from "vue";
import { Store } from "@tanstack/vue-store";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  getTokenFromStorage,
  loadPersistedState,
  persistStoreState
} from "../session-store/session-store.utils";
import {
  loadAllSessionUsers,
  loadUser,
  mintGuestToken
} from "./session-store.services";
import { initCookieSync, notifyLogoutSubscribers } from "./session-store.sync";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import {
  defaultsDeep,
  first,
  forEach,
  has,
  isEmpty,
  keys,
  set
} from "lodash-es";
import type {
  PersistedSessionState,
  SessionEntry,
  SessionState,
  SessionStoreConfig
} from "./session-store.types";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module session-store/store
 * @description Session store singleton.
 *
 * WARNING: Do not import directly. Use via useSessionStore composable only.
 */

// --- Store config (module-level, not persisted)

/**
 * Config for this app instance.
 * NOT persisted — each app sets its own scopes on init.
 */
let storeConfig: SessionStoreConfig = {};

/**
 * Check if an actor scope is allowed by the current store config.
 * Returns true if no restriction is set or the actor is in the allowed list.
 */
export function isScopeAllowed(actor: AccessRoleTypes): boolean {
  if (!storeConfig.allowedScopes) return true;
  return storeConfig.allowedScopes.includes(actor);
}

/**
 * Resolve a valid active-session pointer for a candidate state.
 *
 * Pure and synchronous — no side effects, no network. If the current pointer
 * is still backed by a real session it is respected; otherwise it falls by
 * priority (staff > client) within allowed scopes, with GUEST as the floor.
 *
 * @private
 */
export function resolveActiveSession(
  s: SessionState
): Pick<SessionState, "activeActor" | "activeSessionId"> {
  if (
    s.activeActor === AccessRoleTypes.STAFF &&
    s.activeSessionId &&
    s.staffSessions[s.activeSessionId]
  )
    return {
      activeActor: AccessRoleTypes.STAFF,
      activeSessionId: s.activeSessionId
    };

  if (
    s.activeActor === AccessRoleTypes.CLIENT &&
    s.activeSessionId &&
    s.clientSessions[s.activeSessionId]
  )
    return {
      activeActor: AccessRoleTypes.CLIENT,
      activeSessionId: s.activeSessionId
    };

  if (isScopeAllowed(AccessRoleTypes.STAFF)) {
    const id = first(keys(s.staffSessions));
    if (id) return { activeActor: AccessRoleTypes.STAFF, activeSessionId: id };
  }

  if (isScopeAllowed(AccessRoleTypes.CLIENT)) {
    const id = first(keys(s.clientSessions));
    if (id) return { activeActor: AccessRoleTypes.CLIENT, activeSessionId: id };
  }

  return { activeActor: AccessRoleTypes.GUEST, activeSessionId: undefined };
}

/**
 * Reconcile the session maps to the live session cookies.
 *
 * The cookie is the single source of truth for an authenticated session; the
 * store maps are a cache. A client/staff session is valid only when backed by a
 * live cookie token — "active session with no cookie token" is unrepresentable.
 * For each authenticated scope the cookie-backed session is kept (its cached
 * user preserved) and every other session is dropped. The guest session mirrors
 * its cookie. Impersonation links and transient flags are left untouched.
 *
 * @private
 */
export function reconcileToCookies(s: SessionState): SessionState {
  const clientToken = getTokenFromStorage(
    AccessRoleTypes.CLIENT
  ) as IToken | null;
  const clientSessions: Record<string, SessionEntry> =
    clientToken?.access_token && clientToken?.actor_id
      ? {
          [clientToken.actor_id]: {
            scope: AccessRoleTypes.CLIENT,
            token: clientToken,
            user: s.clientSessions[clientToken.actor_id]?.user
          }
        }
      : {};

  const staffToken = getTokenFromStorage(
    AccessRoleTypes.STAFF
  ) as IToken | null;
  const staffSessions: Record<string, SessionEntry> =
    staffToken?.access_token && staffToken?.actor_id
      ? {
          [staffToken.actor_id]: {
            scope: AccessRoleTypes.STAFF,
            token: staffToken,
            user: s.staffSessions[staffToken.actor_id]?.user
          }
        }
      : {};

  const guestToken = getTokenFromStorage(
    AccessRoleTypes.GUEST
  ) as IToken | null;

  return {
    ...s,
    clientSessions,
    staffSessions,
    guestSession: guestToken?.access_token ? guestToken : undefined
  };
}

/**
 * The single write gate for the session store.
 *
 * Applies the updater, reconciles the session maps to the live cookies (cookie
 * = truth, the map is a cache), then re-resolves the active pointer over the
 * reconciled result so `activeActor`/`activeSessionId` can never reference a
 * session that does not exist or one not backed by a cookie. All writes route
 * through here; raw `sessionStore.setState` stays for reads (`.state`,
 * `.subscribe`) only.
 */
export function updateSession(
  updater: (s: SessionState) => SessionState
): void {
  const prev = sessionStore.state;
  sessionStore.setState(state => {
    const next = reconcileToCookies(updater(state));
    return { ...next, ...resolveActiveSession(next) };
  });

  // An authenticated actor whose sessions just emptied has logged out — by any
  // cause (explicit logout, cookie loss, cross-tab removal, expiry). Fire the
  // logout signal here so the write gate is the single source of it.
  const next = sessionStore.state;
  if (!isEmpty(prev.clientSessions) && isEmpty(next.clientSessions))
    notifyLogoutSubscribers(AccessRoleTypes.CLIENT);
  if (!isEmpty(prev.staffSessions) && isEmpty(next.staffSessions))
    notifyLogoutSubscribers(AccessRoleTypes.STAFF);
}

/**
 * Build initial session state.
 *
 * 1. Load persisted state from sessionStorage (all sessions, user data, impersonations, active session)
 * 2. Overlay individual session cookies (may have fresher tokens from token refresh)
 * 3. Restore previous active session if still valid, otherwise fall back to staff > client > guest
 *
 * @private
 * @returns Session state ready for hydration
 */
async function buildInitialState(): Promise<SessionState> {
  // --- Step 1: Load persisted state from sessionStorage
  const persisted: PersistedSessionState = defaultsDeep(loadPersistedState(), {
    activeActor: undefined,
    activeSessionId: undefined,
    clientSessions: {},
    staffSessions: {},
    impersonatedSessions: {}
  });

  const clientToken = getTokenFromStorage(
    AccessRoleTypes.CLIENT
  ) as IToken | null;

  if (clientToken?.access_token && clientToken?.actor_id) {
    persisted.clientSessions[clientToken.actor_id] = {
      scope: AccessRoleTypes.CLIENT,
      token: clientToken,
      user: persisted.clientSessions?.[clientToken.actor_id]?.user
    };
  }

  const staffToken = getTokenFromStorage(
    AccessRoleTypes.STAFF
  ) as IToken | null;

  if (staffToken?.access_token && staffToken?.actor_id) {
    persisted.staffSessions[staffToken.actor_id] = {
      scope: AccessRoleTypes.STAFF,
      token: staffToken,
      user: persisted.staffSessions?.[staffToken.actor_id]?.user
    };
  }

  // --- Step 2: Overlay session cookies (may have fresher tokens from refresh)
  //             NB: Mint a new guestToken if no sessions exist AND guest is allowed
  const existingGuestToken = getTokenFromStorage(
    AccessRoleTypes.GUEST
  ) as IToken | null;
  const shouldMintGuest =
    isScopeAllowed(AccessRoleTypes.GUEST) && !(staffToken || clientToken);
  const guestToken = existingGuestToken?.access_token
    ? existingGuestToken
    : shouldMintGuest
      ? await mintGuestToken()
      : null;

  // M5: a two-step guest-customer mint returns a CLIENT-coerced token — route
  // it to clientSessions so the user runs through the client lifecycle. A plain
  // anonymous guest stays in guestSession.
  if (guestToken?.access_token) {
    if (
      guestToken.actor_type === AccessRoleTypes.CLIENT &&
      guestToken.actor_id
    ) {
      persisted.clientSessions[guestToken.actor_id] = {
        scope: AccessRoleTypes.CLIENT,
        token: guestToken,
        user: persisted.clientSessions?.[guestToken.actor_id]?.user
      };
    } else {
      persisted.guestSession = guestToken;
    }
  }

  // --- Build state (user data loaded in next step). The active pointer is
  //     validated by the write gate when `initialise` commits this state.
  const state: SessionState = {
    ...persisted,
    initialised: false,
    loading: true
  };

  // --- Step 4: Load user data for sessions that don't have it yet
  const allSessionUsers = await loadAllSessionUsers(state);

  forEach(allSessionUsers, (userData, sessionId) => {
    if (has(state.clientSessions, sessionId))
      set(state.clientSessions, [sessionId, "user"], userData);

    if (has(state.staffSessions, sessionId))
      set(state.staffSessions, [sessionId, "user"], userData);
  });

  return state;
}

/**
 * Module-level singleton store instance.
 * initialised with default guest state (sync), then async hydration occurs.
 * @internal
 */
export const sessionStore = new Store<SessionState>({
  activeActor: AccessRoleTypes.GUEST,
  activeSessionId: undefined,
  clientSessions: {},
  guestSession: undefined,
  impersonatedSessions: {},
  initialised: false,
  loading: false,
  staffSessions: {}
});

/**
 * Reactivity bridge: Vue computed refs need a reactive dependency to re-evaluate.
 * TanStack Store is NOT Vue-reactive, so we use a tick counter as a signal.
 *
 * Pattern: computed refs depend on `storeTick` for reactivity but read from
 * `sessionStore.state` directly. This avoids stale intermediate refs — the
 * TanStack store is always the single source of truth.
 *
 * @internal
 */
export const storeTick = ref(0);

sessionStore.subscribe(() => {
  storeTick.value++;
});

// --- Auto-persist to sessionStorage on every state change (after initialisation)
// --- Mint a guest token when the gate has floored the active pointer to an
//     unminted guest (the async counterpart to the synchronous write gate).
sessionStore.subscribe(() => {
  if (sessionStore.state.initialised) {
    persistStoreState();

    const { activeActor, guestSession } = sessionStore.state;
    const needsGuest =
      activeActor === AccessRoleTypes.GUEST &&
      !guestSession &&
      isScopeAllowed(AccessRoleTypes.GUEST);
    if (needsGuest) {
      updateSession(state => ({ ...state, initialised: false }));
      queueMicrotask(() => initialise());
    }
  }
});

/**
 * Initialise the session store.
 *
 * 1. Store config (allowedScopes) for this app instance
 * 2. Load persisted state from sessionStorage (all previous sessions)
 * 3. Overlay session cookies (may have fresher tokens)
 * 4. Restore previous active session or fall back to staff > client > guest (respecting allowedScopes)
 * 5. Mint guest token if no sessions exist and guest is allowed
 * 6. Load user data for sessions
 *
 * @param config - Optional config to restrict which actor scopes can be activated
 *
 * @example
 * ```typescript
 * import { initialise } from "@upmind/headless";
 *
 * // Cart app: only client and guest sessions
 * await initialise({ allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST] });
 *
 * // Admin app: only staff sessions
 * await initialise({ allowedScopes: [AccessRoleTypes.STAFF] });
 *
 * // Default: all scopes allowed
 * await initialise();
 * ```
 */
export async function initialise(config?: SessionStoreConfig): Promise<void> {
  // Always apply config, even if init is already in progress.
  // This handles the case where useSessionStore() is called without config
  // (triggering init) before useUpmind passes the config.
  if (config) storeConfig = config;

  if (sessionStore.state.initialised || sessionStore.state.loading) return;

  updateSession(state => ({
    ...state,
    error: undefined,
    loading: true
  }));

  // A required session (the guest mint) failing every retry throws — surface it
  // as a fatal boot error so the app fails loudly and every consumer can react,
  // rather than hanging on the await or booting into a half-initialised store.
  const initialState = await buildInitialState().catch((error: unknown) => {
    updateSession(state => ({
      ...state,
      error:
        error instanceof DetailedError
          ? error
          : new DetailedError(
              "Session store failed to initialise",
              responseCodes.Service_Unavailable,
              ErrorOrigin.Headless
            ),
      initialised: false,
      loading: false
    }));
    return undefined;
  });

  if (!initialState) return;

  // Commit the fully initialised state (triggers auto-persist via subscription)
  updateSession(() => ({
    ...initialState,
    initialised: true,
    loading: false
  }));

  // Start cookie change monitoring for external/manual cookie edits
  initCookieSync();
}

/**
 * Re-hydrate the session store from sessionStorage + cookies.
 * Used for cross-tab sync (BroadcastChannel UNAUTHENTICATED) and cookie change events.
 *
 * Reads persisted state from sessionStorage and applies it through the write
 * gate, which reconciles the maps to the live cookies (cookie = truth) and
 * re-resolves the active pointer.
 *
 * **Important:** Does NOT mint guest tokens. Guest minting only happens during
 * initial app load via `initialise`. The active client session's `/self` user
 * is refreshed below so cross-tab verification state stays current.
 */
export async function hydrateFromStorage(): Promise<void> {
  // Don't hydrate before initialisation is complete
  if (!sessionStore.state.initialised) return;

  // Re-read persisted state (same as buildInitialState but skip guest mint).
  const persisted: PersistedSessionState = defaultsDeep(loadPersistedState(), {
    activeActor: undefined,
    activeSessionId: undefined,
    clientSessions: {},
    staffSessions: {},
    impersonatedSessions: {}
  });

  // Apply via the gate, preserving transient flags. The gate reconciles the
  // persisted maps to the live cookies (cookie = truth) and re-resolves the
  // active pointer over the result (GUEST floor).
  updateSession(state => ({
    ...persisted,
    initialised: state.initialised,
    loading: state.loading
  }));

  // --- Cross-tab freshness (M1): re-map a FRESH actor.is_guest /
  // default_email.verified for the receiving tab rather than the cached
  // snapshot, so isUnverified reads current server state after a SET_SESSION.
  const { activeActor, activeSessionId } = sessionStore.state;
  if (activeActor === AccessRoleTypes.CLIENT && activeSessionId) {
    const token = sessionStore.state.clientSessions[activeSessionId]?.token;
    if (token?.access_token) {
      const user = await loadUser(token).catch(() => undefined);
      if (user) {
        updateSession(state => ({
          ...state,
          clientSessions: {
            ...state.clientSessions,
            [activeSessionId]: {
              ...state.clientSessions[activeSessionId],
              user
            }
          }
        }));
      }
    }
  }
}
