import { ScopeActorTypes } from "../scope/scope.types";
import type { DetailedError } from "../../utils";
import type { Account } from "../client";
import type {
  AccessRoleTypes,
  IBrand,
  IClient,
  IContractProduct,
  IInvoice,
  ISelf,
  IToken,
  ITicket,
  UpmindObjectTypes
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module session-store/types
 * @description Session store type definitions.
 * @see graphify-out/ for IBrand, ISelf, UpmindObjectTypes type provenance
 * (FE-2973 brand plumbing; FE-3036 confirmed via `graphify query "delegated
 * ids delegatable record owner"` that no `DelegatableRecord`/owner type
 * already exists in the tree).
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
  /** Staged-import (read-only) client; mapped from actor.staged_import (graphify-out/). */
  staged_import?: boolean;
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
  /**
   * Object ids delegated to this client, keyed by object type
   * (graphify-out/ — confirmed no prior `delegatedIds` member on this type).
   * `{}` for staff and guest — `/admin/self` never requests the field and a
   * guest has no `SessionUser` at all. `null` on the wire (the only recorded
   * case today) maps to `{}`, never to `undefined`.
   */
  delegatedIds: Partial<Record<UpmindObjectTypes, string[]>>;
};

/**
 * Record types the server can mark as delegated to the active client
 * (graphify-out/ — `graphify query "IOrder IInvoice alias delegatable record
 * order delegate_related"` confirms `IOrder` carries no node of its own).
 *
 * ORDERS ARE COVERED, via `IInvoice`. `IOrder` is a straight alias of
 * `IInvoice` (`types/src/models/orders.ts:3`), so an order both satisfies this
 * union and takes the invoice arm of `isDelegated` — child-account exclusion
 * and all. That matches the oracle: the legacy orders module maps
 * `belongsToDelegate` onto the invoices getter verbatim
 * (`vue-app src/store/modules/data/orders/index.ts:65-68`, commented "Map to
 * identical INVOICES getter"), and orders render the same delegated badge
 * (`orderRowItem.vue:99`). Naming `IOrder` here would be a no-op alias in the
 * union, not extra coverage.
 */
export type DelegatableRecord = IInvoice | IContractProduct | ITicket;

/**
 * The owning client of a delegated record, read off the record's own embedded
 * `client` relation. Every field optional because every source field is.
 */
export type DelegatedRecordOwner = {
  id?: IClient["id"];
  publicName?: IClient["public_name"];
  username?: IClient["username"];
  imageUrl?: IClient["image_url"];
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
  /**
   * Guest sessions keyed by session id — the same shape `clientSessions` and
   * `staffSessions` use, so a guest session is selected by its own key exactly
   * as client and staff are (FE-3087). Reuses `SessionEntry` rather than
   * minting a guest-specific type; see graphify-out/ for the `SessionEntry` /
   * `IToken` provenance confirming it already models this pair.
   *
   * At most one entry is cookie-backed at a time: the cookie layer holds a
   * single `upm_guest_session`.
   */
  guestSessions: Record<string, SessionEntry>;
  clientSessions: Record<string, SessionEntry>;
  staffSessions: Record<string, SessionEntry>;
  activeActor: AccessRoleTypes;
  /**
   * The active session's key in `activeActor`'s own session map — guest
   * included. Client/staff key by the server `actor_id`; a guest key is
   * client-synthesised (the guest grant returns `actor_id: ""`) and carried on
   * the guest cookie.
   *
   * For guest the key's PRESENCE records intent: a key means guest was chosen
   * via `activate(GUEST)`; no key means guest is the unclaimed floor the
   * resolver fell back to. Only the floor upgrades on a remote login.
   */
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
  | { type: "REMOVE_GUEST"; sessionId: string }
  | { type: "REMOVE_SESSION"; actor: AccessRoleTypes; sessionId: string }
  | { type: typeof SessionEvents.UNAUTHENTICATED; actor: AccessRoleTypes }
  | { type: "CLEAR" }
  | {
      type: "IMPERSONATION_REGISTERED";
      impersonatedSessionId: string;
      impersonatorSessionId: string;
    };
