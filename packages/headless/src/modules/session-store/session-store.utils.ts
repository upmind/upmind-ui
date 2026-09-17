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
  map,
  omit,
  omitBy,
  values
} from "lodash-es";
import type {
  AuthEventType,
  DelegatableRecord,
  DelegatedRecordOwner,
  PersistedSessionState,
  SessionEntry,
  SessionState,
  SessionUser,
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
 * The `&& scopeContext.id` is load-bearing: the context id became OPTIONAL in
 * FE-3239, so an id-less `client` context would otherwise return `undefined`
 * AS the identity instead of falling through to the session. The guard now
 * holds what the type used to hold.
 *
 * @param scopeContext - The resolved scope context, if the scope carries one
 * @returns The client id to address, or `undefined` while none resolves
 */
export function resolveClientId(
  scopeContext?: ScopeContext
): ComputedRef<string | undefined> {
  return computed(() => {
    if (scopeContext?.type === AccessRoleTypes.CLIENT && scopeContext.id)
      return scopeContext.id;

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
  if (actor === AccessRoleTypes.GUEST) return store.state.guestSessions;
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

// -----------------------------------------------------------------------------
// Delegate Helpers

/**
 * Whether a record is currently delegated to the active client.
 *
 * Per-object-type, oracle-faithful: invoices/orders apply the child-account
 * exclusion first (`vue-app src/store/modules/data/invoices/index.ts:143-146`),
 * contract products and tickets read the bare flag with no exclusion
 * (`cProdProvider.vue:190`, `ticketProvider.ts:161`).
 */
export function isDelegated(record: DelegatableRecord): boolean {
  if ("delegate_related" in record) {
    if (record.client?.parent_client_config?.parent_client_id) return false;
    return !!record.delegate_related;
  }

  return !!record.is_delegated_object;
}

/**
 * @decision
 * what:     `getOwnerForDelegatedRecord` keeps a `_delegatedIds` parameter it
 *           never reads.
 * why:      The story's AC names the two-argument signature, and the operator
 *           settled on keeping it (factory Plan dispatch, clause 5) so
 *           consumers written against the AC text compile. The map holds
 *           object-type → object-id and carries no owner identity, so the
 *           parameter cannot contribute to the answer; the oracle reads the
 *           record's own embedded client at every owner site
 *           (`invoiceDelegateTooltip.vue:4-8,48-50`).
 * rejected: Dropping the parameter (departs from the AC's named signature and
 *           the operator's settled decision). Deriving the owner from the map
 *           (impossible — no owner identity is in it). Returning the client
 *           id only (the oracle displays name, username and avatar too).
 */
export function getOwnerForDelegatedRecord(
  record: DelegatableRecord,
  _delegatedIds?: SessionUser["delegatedIds"]
): DelegatedRecordOwner | undefined {
  const client = record.client;
  if (!client) return undefined;

  return {
    id: client.id,
    publicName: client.public_name,
    username: client.username,
    imageUrl: client.image_url
  };
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

/**
 * A random UUID v4, in the same id space as a server `actor_id`.
 *
 * `crypto.randomUUID` exists only in a secure context, so it is `undefined` on
 * a plain-http origin (the e2e host) and minting a guest there would throw.
 * `getRandomValues` carries no such restriction.
 *
 * @returns A version-4 UUID
 */
function randomSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] as number) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;

  const hex = map(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join("-");
}

/**
 * Resolve the session id a guest token is stored under, and stamp it onto the
 * token so the guest cookie carries it (FE-3087, operator ruling R6).
 *
 * The guest grant returns `actor_id: ""`, so a guest session id has to be
 * client-synthesised. Carrying it on the cookie is what makes the id survive
 * the token changing: a refresh mints a new token with `actor_id: ""` again, so
 * without this the guest session would be re-keyed on every refresh and an
 * explicitly chosen guest would silently fall back to the floor.
 *
 * @param token - The guest token about to be written to its cookie
 * @param newSession - True when the token opens a new session and so inherits
 *   no id; the intent travels with the persist call, never inferred from state
 * @returns The token carrying a stable guest session id
 */
function withGuestSessionId(token: IToken, newSession?: boolean): IToken {
  if (token.actor_id) return token;
  const current = newSession
    ? undefined
    : (getTokenFromStorage(AccessRoleTypes.GUEST) as IToken | null);
  return { ...token, actor_id: current?.actor_id || randomSessionId() };
}

/**
 * The session id a guest token is keyed under — pure, no cookie write.
 *
 * For a token the guest cookie does NOT back: the persisted-state migration
 * keys a legacy guest with this, and must not touch the cookie doing so — a
 * cookie written from persisted state would make the boot mint decision read a
 * guest that no live cookie holds.
 *
 * @param token - The guest token being keyed
 * @returns The guest session id
 */
export function resolveGuestSessionId(token: IToken): string {
  return withGuestSessionId(token).actor_id as string;
}

/**
 * Resolve the id a cookie-backed guest session is keyed by, migrating a guest
 * cookie written before FE-3087 that carries no id (operator ruling R6).
 *
 * The cookie is the id authority for a guest session, so this runs once per
 * boot on the live guest cookie BEFORE the persisted state is read — the
 * migration then adopts the id from the stamped cookie rather than synthesising
 * a second one for the same session. Everything downstream —
 * `reconcileToCookies`, `add`, the `SET_SESSION` handler — reads the id
 * straight off the cookie/token as it does for client and staff.
 *
 * @param token - The guest token read from the guest cookie
 * @returns The guest session id, written back to the cookie when synthesised
 */
export function resolveGuestCookieId(token: IToken): string {
  const stamped = withGuestSessionId(token);

  // Reference identity is the signal that an id was synthesised — the helper
  // returns the SAME object when the cookie already carried one, so only a
  // genuine migration pays a cookie write.
  if (stamped !== token)
    useCookies().setTopLevel(`upm_${AccessRoleTypes.GUEST}_session`, stamped, {
      expires: "8h"
    });

  return stamped.actor_id as string;
}

/**
 * The live guest session's token — the one guest the singular public surface
 * (`get(GUEST)`, the `guestSession` context member) means when several are
 * pooled.
 *
 * Ordered: the guest the active pointer names, else the cookie-backed guest,
 * else the pool's first. Only one guest is cookie-backed at a time, exactly as
 * for client and staff.
 *
 * @param s - The session state slice the guest pool and pointer live on
 * @returns The live guest's token, or undefined while no guest is pooled
 */
export function getLiveGuestToken(
  s: Pick<SessionState, "activeActor" | "activeSessionId" | "guestSessions">
): IToken | undefined {
  if (
    s.activeActor === AccessRoleTypes.GUEST &&
    s.activeSessionId &&
    s.guestSessions[s.activeSessionId]
  )
    return s.guestSessions[s.activeSessionId]?.token;

  const cookieId = (getTokenFromStorage(AccessRoleTypes.GUEST) as IToken | null)
    ?.actor_id;
  if (cookieId && s.guestSessions[cookieId])
    return s.guestSessions[cookieId]?.token;

  return first(values(s.guestSessions))?.token;
}

/**
 * Write a token to its scope cookie and, unless the caller wants the cookie
 * only, into the session store.
 *
 * @param token - The token to persist
 * @param opts - `event` drives the login/sign_up dataLayer event; `sync: false`
 *   writes the cookie without routing back through `add`; `newSession: true`
 *   declares the token opens a NEW session rather than continuing one, so a
 *   guest token takes its own id instead of inheriting the cookie's
 * @returns The persisted token, carrying the id it was stored under
 * @throws DetailedError when the token has no `access_token`, or when
 *   localStorage is unavailable
 */
export function persistTokenToStorage(
  token: IToken,
  opts?: { event?: AuthEventType; newSession?: boolean; sync?: boolean }
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

  if (actor_type === AccessRoleTypes.GUEST)
    token = withGuestSessionId(token, opts?.newSession);

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
