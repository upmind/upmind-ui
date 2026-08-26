import { ScopeActorTypes } from "../scope/scope.types";
import type { DetailedError } from "../../utils";
import type { Account } from "../client";
import type { IBrand, IClient, ISelf, IToken } from "@upmind-automation/types";
import type { AccessRoleTypes } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module session-store/types
 * @description Session store type definitions.
 * @see graphify-out/ for IBrand, ISelf type provenance (FE-2973 brand plumbing)
 */

/**
 * Scope matrix for useActiveSession composable.
 * Session scope is simple - no context needed for any actor.
 */
export const SESSION_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

export type SessionScopeMatrix = typeof SESSION_SCOPE_MATRIX;

/**
 * Configuration for the session store.
 * Controls which actor scopes can be activated in this app instance.
 */
export type SessionStoreConfig = {
  /** Actor scopes allowed for this app instance. Undefined = all allowed. */
  allowedScopes?: AccessRoleTypes[];
};

/**
 * Impersonation state for tracking parent session.
 * This is used to restore the "parent" session after impersonation.
 * The key being the impersonated actor ID and the value being the impersonator ( initiating actor) ID.
 */
export type Impersonations = Record<string, string>;

/**
 * Interface representing an authentication token and its associated metadata.
 * This token is typically used for API authorisation.
 */
export type Token = {
  /**
   * The access token string, used for authenticating API requests.
   */
  access_token: string | null;
  /**
   * The timestamp when the token was created (Unix epoch time), if available.
   */
  created_at?: number | null;
  /**
   * The duration (in seconds) until the access token expires.
   */
  expires_in: number | null;
  /**
   * The duration (in seconds) until the refresh token expires.
   */
  refresh_expires_in: number | null;
  /**
   * The refresh token string, used to get a new access token without re-authentication.
   */
  refresh_token: string | null;
  /**
   * `true` if a second factor (e.g. 2FA code) is required for full authentication.
   */
  second_factor_required: boolean | null;
  /**
   * The origin URL to redirect to after authentication, if specified.
   */
  redirect?: Location["origin"] | null;
  /**
   * The ID of the actor associated with this token.
   */
  actor_id?: string | null;
  /**
   * The type of actor associated with this token (e.g. 'guest', 'client').
   * Uses AccessRoleTypes enum values.
   */
  actor_type: `${AccessRoleTypes}`;
  /**
   * A guest token string, used for non-authenticated sessions.
   */
  guest_token?: string | null;
};

/**
 * Minimal user info for display in session switcher/dropdown.
 * Populated from auth loadUser response.
 */
export type SessionUser = {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  publicName?: string;
  language: string;
  locale: string;
  customFields?: IClient["custom_fields"];
  avatar?: {
    caption: string;
    src?: string;
    forceCaption: boolean;
  };
  /**
   * Whether the active session's client is a guest-customer.
   * Single isGuest mapper (F5): populated by mapSessionUser from actor.is_guest.
   */
  isGuest?: boolean;
  /**
   * Primary email with verification status (M1/M6/M7).
   * Populated by mapSessionUser from actor.default_email.
   */
  primaryEmail?: {
    id: string;
    email: string;
    isVerified: boolean;
  };
  /** Convenience id of the primary email record. */
  primaryEmailId?: string;
  /**
   * Parsed client accounts (M5 / payment-detail currency fallback).
   * Mapped by mapSessionUser from the top-level ISelf.accounts.
   */
  accounts?: Account[];
  /**
   * Computed display name (firstName || publicName || email).
   * Mapped by mapSessionUser to back the client view-model on useSession.context.
   */
  display?: string;
  /**
   * Analytics envelope from /self — backs the upm_actor cookie + the
   * login/sign_up/logout dataLayer events. Held on the SessionUser so it lives
   * in the store (cache-safe), not only on the cached /self fetch.
   */
  analytics?: ISelf["analytics"];
  /**
   * Brand ID this session belongs to (FE-2973, graphify-out/ IBrand).
   * - Client/Guest: from ISelf.brand_id (the client's home brand)
   * - Staff: undefined (staff can access multiple brands)
   */
  brandId?: IBrand["id"];
  /**
   * Brands accessible to this session (staff only).
   * Populated from /admin/self?with=brands for staff sessions.
   */
  brands?: IBrand[];
};

/**
 * A session entry pairs a token with optional user profile data.
 * Used in clientSessions and staffSessions records.
 */
export type SessionEntry = {
  scope: AccessRoleTypes;
  token: IToken;
  user?: SessionUser;
};

/**
 * Result of loading `/self` for every session during boot resolution.
 * `users` holds the profiles that loaded; `invalidSessionIds` names the
 * sessions whose token returned `401` (dead token) and must be dropped so boot
 * falls through to the guest floor. A non-401 failure is a soft degrade and
 * appears in neither list.
 */
export type LoadedSessionUsers = {
  users: Record<string, SessionUser>;
  invalidSessionIds: string[];
};

/**
 * Store state for managing multiple actor sessions.
 */
export type SessionState = {
  guestSession?: IToken;
  clientSessions: Record<string, SessionEntry>;
  staffSessions: Record<string, SessionEntry>;
  activeActor: AccessRoleTypes;
  activeSessionId?: string;
  /**
   * Impersonation sessions - tracks parent sessions for restoration.
   * eg: When staff impersonates client, the staff session is stored here against the client session ID.
   */
  impersonatedSessions: Impersonations;
  /**
   * True when store initialization is complete.
   */
  initialised: boolean;

  /**
   * True when user data is being loaded for active session(s).
   * Used to show loading state in UI while hydrating from cookies on app load.
   */
  loading: boolean;

  /**
   * Fatal boot error. Set when `initialise` cannot establish a required session
   * (e.g. the guest mint failed every retry). A guest session is guaranteed by
   * design, so this is a hard failure the app must surface — not a state the
   * store silently recovers from. Cleared on a successful (re)initialise.
   */
  error?: DetailedError;

  /**
   * `/self` failure from the most recent INTERACTIVE login/register. The
   * session is still promoted (usable without user data), but an interactive
   * caller is actively waiting, so `whenAuthenticated()` rejects with this
   * instead of hanging for a user that will never load. Transient (not
   * persisted); overwritten/cleared by the next interactive `add()`.
   */
  userError?: DetailedError;
};

/**
 * Shape persisted to sessionStorage.
 * Contains all session data needed to fully restore the store on page reload.
 * Excludes transient flags (`initialised`, `loading`) which reset on each load.
 */
export type PersistedSessionState = Omit<
  SessionState,
  "initialised" | "loading" | "error" | "userError"
>;

/**
 * Shared session event names used by both the authSubscription helper
 * (XState callback actor) and BroadcastChannel cross-tab sync.
 */
export const SessionEvents = {
  /** Active session token changed (new session set or switched). */
  SESSION: "SESSION",
  /** Transitioned from unauthenticated → authenticated (login). */
  AUTHENTICATED: "AUTHENTICATED",
  /** Transitioned from authenticated → unauthenticated (logout). */
  UNAUTHENTICATED: "UNAUTHENTICATED"
} as const;

export type SessionEventType =
  (typeof SessionEvents)[keyof typeof SessionEvents];

/**
 * Interactive auth action that minted a token. Passed through `add()` /
 * `persistTokenToStorage` to drive the login/sign_up dataLayer event and the
 * subsequent-login `/self` cache-bust.
 */
export const AuthEvents = {
  /** Username/password (or 2FA) login. */
  LOGIN: "login",
  /** Account registration (client register / register-as-guest). Value is the
   * GTM dataLayer event name (`sign_up`), pushed directly — no remap. */
  REGISTER: "sign_up"
} as const;

export type AuthEventType = (typeof AuthEvents)[keyof typeof AuthEvents];

/**
 * Message format for BroadcastChannel session sync.
 */
export type SessionSyncMessage =
  | { type: "SET_SESSION"; session: IToken }
  | { type: "REMOVE_GUEST" }
  | { type: "REMOVE_SESSION"; actor: AccessRoleTypes; sessionId: string }
  | { type: typeof SessionEvents.UNAUTHENTICATED; actor: AccessRoleTypes }
  | { type: "CLEAR" }
  | {
      type: "IMPERSONATION_REGISTERED";
      impersonatedSessionId: string;
      impersonatorSessionId: string;
    };
