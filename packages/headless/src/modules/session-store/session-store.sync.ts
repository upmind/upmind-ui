import { AccessRoleTypes } from "@upmind-automation/types";
import {
  sessionStore,
  updateSession,
  hydrateFromStorage
} from "./session-store.store";
import { SessionEvents } from "./session-store.types";
import { getTokenFromStorage } from "./session-store.utils";
import { useActiveSession } from ".";
import { useCookies } from "../../utils";
import { includes, omit, some } from "lodash-es";
import type { SessionSyncMessage } from "./session-store.types";
import type { CookieChangeCallback } from "../../utils/useCookies";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module session-store/sync
 * @description Session sync and subscription module.
 * Handles cross-tab sync via BroadcastChannel, cookie persistence sync,
 * and the authSubscription callback actor for XState machines.
 *
 * WARNING: Do not import directly. Use via useSessionStore composable only.
 */

const BROADCAST_CHANNEL_NAME = "upm_session";

// --- Logout subscribers
type LogoutCallback = (actor: AccessRoleTypes) => void;
const logoutSubscribers = new Set<LogoutCallback>();

export function subscribeToLogout(callback: LogoutCallback): () => void {
  logoutSubscribers.add(callback);
  return () => logoutSubscribers.delete(callback);
}

export function notifyLogoutSubscribers(actor: AccessRoleTypes): void {
  logoutSubscribers.forEach(cb => cb(actor));
}

export const sessionChannel: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    : null;

export function broadcastSessionChange(message: SessionSyncMessage): void {
  sessionChannel?.postMessage(message);
}

export function handleIncomingBroadcast(
  event: MessageEvent<SessionSyncMessage>
): void {
  const message = event.data;

  switch (message.type) {
    case "SET_SESSION": {
      const actor = message.session.actor_type as AccessRoleTypes;
      const sessionId = message.session.actor_id;

      if (actor === AccessRoleTypes.GUEST) {
        updateSession(state => ({
          ...state,
          guestSession: message.session
        }));
      } else if (sessionId) {
        updateSession(state => {
          if (actor === AccessRoleTypes.CLIENT) {
            return {
              ...state,
              clientSessions: {
                ...state.clientSessions,
                [sessionId]: {
                  scope: AccessRoleTypes.CLIENT,
                  token: message.session,
                  user: state.clientSessions[sessionId]?.user
                }
              }
            };
          }

          return {
            ...state,
            staffSessions: {
              ...state.staffSessions,
              [sessionId]: {
                scope: AccessRoleTypes.STAFF,
                token: message.session,
                user: state.staffSessions[sessionId]?.user
              }
            }
          };
        });
      }
      break;
    }

    case "REMOVE_GUEST":
      updateSession(state => ({
        ...state,
        guestSession: undefined
      }));
      break;

    case "REMOVE_SESSION":
      updateSession(state => ({
        ...state,
        clientSessions:
          message.actor === AccessRoleTypes.CLIENT
            ? omit(state.clientSessions, message.sessionId)
            : state.clientSessions,
        staffSessions:
          message.actor === AccessRoleTypes.STAFF
            ? omit(state.staffSessions, message.sessionId)
            : state.staffSessions
      }));
      break;

    case "IMPERSONATION_REGISTERED": {
      // Store subscription auto-persists to sessionStorage
      updateSession(state => ({
        ...state,
        impersonatedSessions: {
          ...state.impersonatedSessions,
          [message.impersonatedSessionId]: message.impersonatorSessionId
        }
      }));
      break;
    }

    case "CLEAR":
      updateSession(state => ({
        ...state,
        guestSession: undefined,
        clientSessions: {},
        staffSessions: {},
        activeActor: AccessRoleTypes.GUEST,
        activeSessionId: undefined,
        impersonatedSessions: {}
      }));
      break;

    case SessionEvents.UNAUTHENTICATED:
      // UNAUTHENTICATED event means a session was logged out in another tab
      // The cookie has already been removed by the originating tab
      // Re-hydrate from sessionStorage + cookies to sync state
      hydrateFromStorage();
      break;
  }
}

sessionChannel?.addEventListener("message", handleIncomingBroadcast);
// --- Cookie Sync
const SESSION_COOKIE_NAMES = [
  "upm_guest_session",
  "upm_client_session",
  "upm_user_session",
  "upm_admin_session"
];

/**
 * Global key for cookie-sync state. Uses Symbol.for so the same symbol is
 * reachable across module resets (vi.resetModules in tests). Without this,
 * each fresh module realm would start its own poll interval, leaking timers
 * that blow hook timeouts on slow CI runners.
 */
const COOKIE_SYNC_KEY = Symbol.for("upmind:cookie-sync");

interface CookieSyncState {
  pollInterval: ReturnType<typeof setInterval> | null;
  removeChangeListener: (() => void) | undefined;
  lastGuestToken: string | undefined;
  lastClientToken: string | undefined;
  lastStaffToken: string | undefined;
}

function getGlobalSyncState(): CookieSyncState {
  const g = globalThis as unknown as Record<symbol, CookieSyncState>;
  if (!g[COOKIE_SYNC_KEY]) {
    g[COOKIE_SYNC_KEY] = {
      pollInterval: null,
      removeChangeListener: undefined,
      lastGuestToken: undefined,
      lastClientToken: undefined,
      lastStaffToken: undefined
    };
  }
  return g[COOKIE_SYNC_KEY];
}

function isSessionCookie(name: string): boolean {
  return some(SESSION_COOKIE_NAMES, prefix => includes(name, prefix));
}

export function initCookieSync(): () => void {
  // Stop any existing sync first — handles orphaned intervals from module
  // resets in tests, and is idempotent in production (single init).
  stopCookieSync();

  const sync = getGlobalSyncState();
  const { addChangeListener, isChangeListenerSupported } = useCookies();

  // CookieStore change events (Chromium) are a fast path only: they fire for
  // programmatic writes/removals but NOT for manual devtools cookie edits, so
  // the poll below always runs as the real external-edit detector.
  if (isChangeListenerSupported()) {
    const handleCookieChange: CookieChangeCallback = event => {
      const sessionChanged =
        some(event.changed, c => c.name && isSessionCookie(c.name)) ||
        some(event.deleted, c => c.name && isSessionCookie(c.name));

      if (sessionChanged) {
        hydrateFromStorage();
      }
    };

    sync.removeChangeListener = addChangeListener(handleCookieChange);
  }

  // Poll cookies every 2s — the only mechanism that catches manual/devtools
  // edits, and the sole detector on browsers without CookieStore API
  // (Firefox, Safari). Compares cookie access_tokens against store state.
  function snapshotCookies(): void {
    sync.lastGuestToken =
      (getTokenFromStorage(AccessRoleTypes.GUEST) as IToken | null)
        ?.access_token ?? undefined;
    sync.lastClientToken =
      (getTokenFromStorage(AccessRoleTypes.CLIENT) as IToken | null)
        ?.access_token ?? undefined;
    sync.lastStaffToken =
      (getTokenFromStorage(AccessRoleTypes.STAFF) as IToken | null)
        ?.access_token ?? undefined;
  }

  // Capture initial snapshot
  snapshotCookies();

  sync.pollInterval = setInterval(() => {
    const guest =
      (getTokenFromStorage(AccessRoleTypes.GUEST) as IToken | null)
        ?.access_token ?? undefined;
    const client =
      (getTokenFromStorage(AccessRoleTypes.CLIENT) as IToken | null)
        ?.access_token ?? undefined;
    const staff =
      (getTokenFromStorage(AccessRoleTypes.STAFF) as IToken | null)
        ?.access_token ?? undefined;

    if (
      guest !== sync.lastGuestToken ||
      client !== sync.lastClientToken ||
      staff !== sync.lastStaffToken
    ) {
      sync.lastGuestToken = guest;
      sync.lastClientToken = client;
      sync.lastStaffToken = staff;
      hydrateFromStorage();
    }
  }, 2000);

  const unsubscribe = (): void => {
    stopCookieSync();
  };
  return unsubscribe;
}

export function stopCookieSync(): void {
  const sync = getGlobalSyncState();
  sync.removeChangeListener?.();
  if (sync.pollInterval) clearInterval(sync.pollInterval);
  sync.pollInterval = null;
  sync.removeChangeListener = undefined;
}

export function isCookieSyncActive(): boolean {
  return getGlobalSyncState().pollInterval !== null;
}

/**
 * Auth subscription helper for XState machines.
 * Spawned as a callback actor, emits events to the parent machine:
 *
 * - SESSION: A new active session was set (guest, client, or staff).
 *   Fires any time the active session token changes.
 * - AUTHENTICATED: Transitioned from unauthenticated → authenticated (login).
 * - UNAUTHENTICATED: Transitioned from authenticated → unauthenticated (logout).
 *
 * Auth events are emitted BEFORE session events so machines can
 * clean up state (e.g. clear basket on logout) before reloading
 * with the new session.
 *
 * Uses raw TanStack store subscription (not Vue watch) so it works
 * inside XState's spawn() context which runs outside Vue's effect scope.
 *
 * Fires an initial callback on creation: SESSION if a session exists,
 * AUTHENTICATED if authenticated. Never fires UNAUTHENTICATED on initial.
 */
export const authSubscription = (
  callback: (event: { type: string }) => void,
  onReceive: (handler: (event: unknown) => void) => void
): (() => void) => {
  let lastToken: string | null = null;
  let wasAuthenticated = false;

  onReceive((_event: unknown) => {
    // no-op — parent machine doesn't send events to this actor
  });

  function processStateChange(): void {
    const { useMeta, useContext } = useActiveSession();
    const { isAvailable, isAuthenticated } = useMeta();
    const { session } = useContext();
    // Skip until store is initialised
    if (!isAvailable.value) return;

    // --- Auth transitions (emit FIRST so machines can clean up before reload)
    let unauthEmitted = false;

    // Transition: unauthenticated → authenticated (login)
    if (isAuthenticated.value && !wasAuthenticated) {
      wasAuthenticated = true;
      callback({ type: SessionEvents.AUTHENTICATED });
    }

    // Transition: authenticated → unauthenticated (logout)
    if (!isAuthenticated.value && wasAuthenticated) {
      wasAuthenticated = false;
      unauthEmitted = true;
      callback({ type: SessionEvents.UNAUTHENTICATED });
    }

    // --- Session transitions (emit AFTER auth so loading uses correct state)

    // New or changed active session token
    if (
      session.value?.access_token &&
      session.value.access_token !== lastToken
    ) {
      // Replacing an existing token means the prior session is gone — clear the
      // previous identity's machine state (e.g. basket) before loading the new
      // one. Skipped for the very first token (no prior identity).
      if (lastToken && !unauthEmitted) {
        unauthEmitted = true;
        callback({ type: SessionEvents.UNAUTHENTICATED });
      }
      lastToken = session.value.access_token;
      callback({ type: SessionEvents.SESSION });
    }

    // Active session token lost (guest swap mid-mint, logout, session removed).
    // Emit UNAUTHENTICATED so machines (e.g. basket) clear the previous
    // identity's state before the next session loads — guest tokens now change
    // at runtime, so a guest→guest swap must reset like any other. Guarded to
    // avoid double-firing with the auth-transition emit above.
    if (!session.value?.access_token && lastToken) {
      lastToken = null;
      if (!unauthEmitted) callback({ type: SessionEvents.UNAUTHENTICATED });
    }
  }

  // --- Initial state check (defer to next microtask so parent machine
  // has finished entering its state and can receive events)
  queueMicrotask(processStateChange);

  // --- Subscribe to future store changes
  const unsubscribe = sessionStore.subscribe(processStateChange);

  return () => {
    unsubscribe();
  };
};
