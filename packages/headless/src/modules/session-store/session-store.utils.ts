import { computed } from "vue";
import {
  AccessRoleTypes,
  type ISelf,
  type IToken
} from "@upmind-automation/types";
import { useSessionStore } from "../session-store";
import { useDataLayer } from "../system-analytics";
import { useI18n } from "../system-localisation";
import { mapToken } from "./session-store.mappers";
import {
  sessionStore as store,
  storeTick,
  isScopeAllowed
} from "./session-store.store";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCookies,
  useSessionStorage
} from "../../utils";
import {
  first,
  get,
  has,
  isObject,
  keys,
  omit,
  omitBy,
  values
} from "lodash-es";
import type {
  AuthEventType,
  PersistedSessionState,
  SessionEntry,
  Token
} from "./session-store.types";
import type { ScopeContext } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module session-store/utils
 * @description Session store utility functions.
 */

/**
 * Resolves the client id a call addresses: a `client` scope context wins,
 * otherwise the active session's own user.
 *
 * @param scopeContext - The resolved scope context, if the scope carries one
 * @returns The client id to address, or `undefined` while none resolves
 */
export function resolveClientId(
  scopeContext?: ScopeContext
): ComputedRef<string | undefined> {
  return computed(() => {
    if (scopeContext?.type === AccessRoleTypes.CLIENT) return scopeContext.id;

    // `store.state` is a plain read, so the tick is what makes this reactive.
    void storeTick.value;
    const { activeActor, activeSessionId, clientSessions, staffSessions } =
      store.state;
    if (!activeSessionId || !isScopeAllowed(activeActor)) return undefined;

    if (activeActor === AccessRoleTypes.CLIENT) {
      return get(clientSessions, [activeSessionId, "user", "id"]);
    }
    if (activeActor === AccessRoleTypes.STAFF) {
      return get(staffSessions, [activeSessionId, "user", "id"]);
    }

    return undefined;
  });
}

/**
 * Compute the expiration timestamp for a session from created_at + expires_in.
 */
export function getExpiresAt(session?: IToken | null): number | null {
  if (!session?.created_at) return null;
  const expiresIn = session.expires_in ?? 0;
  return session.created_at + expiresIn * 1000;
}

/**
 * Check if a session token has expired.
 */
export function isTokenExpired(token?: IToken | null): boolean {
  const expiresAt = getExpiresAt(token);
  if (!expiresAt) return true;
  return Date.now() > expiresAt;
}

/**
 * Remove sessions with expired tokens from a sessions record.
 */
export function removeExpiredSessions(
  sessions: Record<string, SessionEntry>
): Record<string, SessionEntry> {
  return omitBy(sessions, entry => isTokenExpired(entry.token));
}

// -----------------------------------------------------------------------------
// Store Persistence (sessionStorage)

const STORAGE_KEY = "upm_session_store";

/**
 * Persist the current store state to sessionStorage.
 * Called via store subscription on every state change (after initialisation).
 * Excludes transient flags (`initialised`, `loading`).
 */
export function persistStoreState(): void {
  const {
    initialised: _initialised, // not needed in storage
    loading: _loading, // not needed in storage
    ...persistable
  } = store.state;
  useSessionStorage().set(STORAGE_KEY, persistable);
}

/**
 * Load persisted store state from sessionStorage.
 * Returns empty object if nothing is stored or data is invalid.
 */
export function loadPersistedState(): PersistedSessionState {
  return useSessionStorage().get(STORAGE_KEY) ?? {};
}

/**
 * Clear persisted store state from sessionStorage.
 */
export function clearPersistedState(): void {
  useSessionStorage().remove(STORAGE_KEY);
}

// -----------------------------------------------------------------------------
// Session Helpers

/**
 * Get the sessions record for an actor type.
 */
export function getSessionsRecord(
  actor: AccessRoleTypes
): Record<string, SessionEntry> | undefined {
  if (actor === AccessRoleTypes.CLIENT) return store.state.clientSessions;
  if (actor === AccessRoleTypes.STAFF) return store.state.staffSessions;
  return undefined;
}

/**
 * Get a session token by actor type and optional session ID.
 * If no sessionId provided, returns the first session for that actor.
 */
export function getSession(
  actor: AccessRoleTypes,
  sessionId?: string
): IToken | undefined {
  const sessions = getSessionsRecord(actor);
  if (!sessions) return undefined;
  const entry = sessionId ? sessions[sessionId] : first(values(sessions));
  return entry?.token;
}

/**
 * Get the first session ID for an actor type.
 */
export function getFirstSessionId(actor: AccessRoleTypes): string | undefined {
  const sessions = getSessionsRecord(actor);
  return sessions ? first(keys(sessions)) : undefined;
}

/**
 * Check if a session exists for an actor type.
 */
export function hasSession(actor: AccessRoleTypes, sessionId: string): boolean {
  const sessions = getSessionsRecord(actor);
  return sessions ? has(sessions, sessionId) : false;
}

/**
 * Find the next available session to activate.
 * Priority: staff → client → guest.
 * Skips actor types not in allowedScopes (if configured).
 */
export function findNextSession(): {
  actor: AccessRoleTypes;
  sessionId?: string;
} {
  if (isScopeAllowed(AccessRoleTypes.STAFF)) {
    const staffId = getFirstSessionId(AccessRoleTypes.STAFF);
    if (staffId) return { actor: AccessRoleTypes.STAFF, sessionId: staffId };
  }

  if (isScopeAllowed(AccessRoleTypes.CLIENT)) {
    const clientId = getFirstSessionId(AccessRoleTypes.CLIENT);
    if (clientId) return { actor: AccessRoleTypes.CLIENT, sessionId: clientId };
  }

  return { actor: AccessRoleTypes.GUEST };
}

export function getTokenFromStorage(actor_type?: Token["actor_type"]) {
  const { get: getCookie } = useCookies();

  const clientCookie = getCookie(`upm_${AccessRoleTypes.CLIENT}_session`) as
    | string
    | undefined;
  if (isObject(clientCookie))
    (clientCookie as Token).actor_type ??= AccessRoleTypes.CLIENT; // NB ensure the actor type in case of impersonation

  const staffCookie = getCookie(`upm_${AccessRoleTypes.STAFF}_session`) as
    | string
    | undefined;
  if (isObject(staffCookie))
    (staffCookie as Token).actor_type ??= AccessRoleTypes.STAFF; // NB ensure the actor type in case of impersonation

  const guestCookie = getCookie(`upm_${AccessRoleTypes.GUEST}_session`) as
    | string
    | undefined;
  if (isObject(guestCookie))
    (guestCookie as Token).actor_type ??= AccessRoleTypes.GUEST; // NB ensure the actor type in case of impersonation

  let token: string | Token;

  if (actor_type === AccessRoleTypes.CLIENT) {
    token = clientCookie || "";
  } else if (actor_type === AccessRoleTypes.STAFF) {
    token = staffCookie || "";
  } else if (actor_type === AccessRoleTypes.GUEST) {
    token = guestCookie || "";
  } else {
    token = staffCookie || clientCookie || guestCookie || "";
  }

  return mapToken(token) as Token;
}

export function persistTokenToStorage(
  token: IToken,
  opts?: { event?: AuthEventType; sync?: boolean }
) {
  const { t } = useI18n();
  const { setTopLevel: setCookie } = useCookies();

  if (!token || !token.access_token)
    throw new DetailedError(
      t("error.token_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      token
    );

  if (!localStorage)
    throw new DetailedError(
      t("error.local_storage_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );

  const actor_type = token?.actor_type || AccessRoleTypes.GUEST;

  // Persist to cookies
  setCookie(`upm_${actor_type}_session`, token, {
    expires: "8h" //default : refresh token and access token are valid for 8 hours
  });

  // Sync to session-store (unless the caller wants the cookie only — e.g. the
  // store's own add/activate projecting the active token, which must not
  // recurse back into add).
  if (opts?.sync !== false) {
    const store = useSessionStore();
    const { isAvailable } = store.useMeta();
    const { add } = store.useActions();
    if (isAvailable.value) add(token, true, undefined, opts?.event);
  }
  return Promise.resolve(token);
}

/**
 * Persist the active actor's analytics envelope to the `upm_actor` cookie
 * (drops environment/language/version, mirroring the legacy behaviour).
 *
 * @param analytics - The active session user's `/self` analytics envelope
 */
export function persistActorToStorage(analytics: ISelf["analytics"]): void {
  useCookies().setTopLevel(
    "upm_actor",
    omit(analytics, ["environment", "language", "version"]),
    { expires: "8h" }
  );
}

/**
 * Remove the `upm_actor` cookie (on logout / when no authenticated actor).
 */
export function dumpActorFromStorage(): void {
  useCookies().removeTopLevel("upm_actor");
}

/**
 * Remove a session from storage (cookie) and sync to session-store state.
 * This is the source of truth for removing sessions.
 *
 * @param actor_type - The actor type (scope/role) to remove
 * @param opts.sync - When false, remove the cookie ONLY (no session-store
 *   mutation, no logout dataLayer) — for the store's own boot-time dead-token
 *   drop, which must not recurse through `remove` or fire a false logout.
 */
export function dumpTokenFromStorage(
  actor_type: Token["actor_type"],
  opts?: { sync?: boolean }
) {
  if (!actor_type) return;

  // Cookie-only removal — skip store sync + logout dataLayer (and the token
  // read below, which that path never uses).
  if (opts?.sync === false) {
    useCookies().removeTopLevel(`upm_${actor_type}_session`);
    return;
  }

  // Get session ID from stored token before removing the cookie.
  const token = getTokenFromStorage(actor_type);
  const sessionId = token?.actor_id ?? undefined;
  useCookies().removeTopLevel(`upm_${actor_type}_session`);

  // Sync to session-store state (if available)
  const store = useSessionStore?.();
  if (store) {
    const { remove } = store.useActions();
    remove(actor_type as AccessRoleTypes, sessionId);
  }

  // Authenticated logout: drop the actor cookie + fire the logout dataLayer.
  // The anonymous guest has no upm_actor and is not a logout.
  if (
    actor_type === AccessRoleTypes.CLIENT ||
    actor_type === AccessRoleTypes.STAFF
  ) {
    dumpActorFromStorage();
    useDataLayer().dataLayer().withUser().push(false);
  }
}
