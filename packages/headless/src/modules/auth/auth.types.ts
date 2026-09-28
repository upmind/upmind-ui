/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/types
 * @description Auth module type definitions.
 * Includes auth machine types (from @next-legacy verbatim) plus the Client and
 * Account interfaces relocated from session/types.ts (M7 — FE-2826).
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { CustomField } from "../client-custom-fields";
import type { PhoneModel } from "../client-phone";
import type { ScopeContext } from "../scope/scope.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { IClient, IToken } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * Context types for auth module.
 * Defines what entities a staff member can authenticate on behalf of.
 */
export enum AuthContextTypes {
  /** Acting on behalf of a client (staff logging in as client). */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Auth flows a client can start.
 * Values double as the machine's flow-state names.
 */
export enum AuthFlowTypes {
  LOGIN = "login",
  RECOVER = "recover",
  REGISTER = "register"
}

/**
 * Auth module scope matrix (runtime value - single source of truth).
 * Defines which actors can operate on which contexts.
 * - staff: can act on behalf of 'client'
 * - client: acts as self only (null)
 * - guest: valid scope but not actionable (can only view, not switch to)
 */
export const AUTH_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: AuthContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: AuthContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/**
 * Auth module context matrix type (derived from runtime const).
 */
export type AuthScopeMatrix = typeof AUTH_SCOPE_MATRIX;

/**
 * Shared query key base - used for invalidation across all scopes.
 * Individual services extend this with scope-specific segments.
 */
export const AUTH_SESSION_QUERY_KEY_BASE = ["session"] as const;

/**
 * Login credentials model.
 */
export type LoginModel = {
  username?: string;
  password?: string;
};

/**
 * Two-factor authentication model.
 */
export type TwoFAModel = {
  token?: string;
};

/**
 * Client registration model.
 */
export type RegisterModel = {
  username?: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  phone?: PhoneModel["phone"];
  customFields?: IClient["custom_fields"];
};

/**
 * Password recovery model.
 */
export type RecoverModel = {
  username?: string;
};

/**
 * Union of all auth model types.
 */
export type AuthModel = LoginModel | TwoFAModel | RegisterModel | RecoverModel;
// -----------------------------------------------------------------------------
/**
 * Context for the auth state machine.
 */
export type AuthContext<ModelType extends AuthModel = AuthModel> = {
  /**
   * Resolved actor type (never SELF - resolved before machine starts).
   */
  scopeActor: ScopeActorTypes;

  /**
   * Optional scope context - who the actor is operating on behalf of.
   * Contains type (e.g., 'client') and id (e.g., client ID).
   * Named 'scopeContext' to distinguish from xstate's 'context'.
   */
  scopeContext?: ScopeContext<`${AuthContextTypes}`>;

  /**
   * Optional brand filter for multi-brand environments.
   */
  brandId?: string;

  /**
   * When true, the machine skips the initial checkSession probe and lands
   * directly on the login form, even if a session of this scope is already
   * active — used to spawn an additional (fresh) session. Set via .fresh().
   */
  newSession?: boolean;

  /**
   * Current auth token, if available.
   */
  token?: IToken;

  /**
   * Form model data.
   */
  model?: ModelType;

  /**
   * Snapshot of model before 2FA challenge (for reset on CANCEL).
   */
  baseModel?: ModelType;

  /**
   * JSON Schema for the current form.
   */
  schema?: JsonSchema;

  /**
   * UI Schema for form rendering.
   */
  uischema?: UISchemaElement;

  /**
   * Lookup data (e.g., custom fields for registration).
   */
  lookups?: {
    customFields?: CustomField[];
  };

  /**
   * Error from last operation.
   */
  error?: ResponseError;

  /**
   * Number of retry attempts.
   */
  retryCount?: number;

  /**
   * Set when a REGISTER submit arrives while the register form is still loading
   * its lookups — the machine stashes the model and replays the submit the moment
   * the form is ready (register.available), rather than dropping it.
   */
  pendingSubmit?: boolean;
};
// -----------------------------------------------------------------------------
/**
 * Events that can be sent to the auth machine.
 */
export type AuthEvent =
  | { type: "LOGIN"; data?: LoginModel }
  | { type: "REGISTER"; data?: RegisterModel }
  | { type: "RECOVER"; data?: RecoverModel }
  | { type: "VERIFY"; data?: string }
  | { type: "AUTHENTICATE"; data?: LoginModel }
  | { type: "CONFIRM"; data?: string }
  | { type: "RETRY" }
  | { type: "CANCEL" }
  | { type: "SET"; data?: Partial<AuthModel> }
  | { type: "TOKEN_EXPIRING" }
  | { type: "REFRESH" };
// -----------------------------------------------------------------------------
/**
 * Result of a successful authentication.
 */
export type AuthResult = {
  token: IToken;
  requires2fa?: boolean;
  requiresConfirmation?: boolean;
};

/**
 * Auth services interface for actor-aware service implementations.
 */
export type AuthServices = {
  authenticate: (
    context: AuthContext<LoginModel>,
    event: AnyEventObject
  ) => Promise<AuthResult>;
  verify2fa: (
    context: AuthContext<TwoFAModel>,
    event: AnyEventObject
  ) => Promise<AuthResult>;
  register: (
    context: AuthContext<RegisterModel>,
    event: AnyEventObject
  ) => Promise<unknown>;
  recover: (
    context: AuthContext<RecoverModel>,
    event: AnyEventObject
  ) => Promise<unknown>;
  /** @deprecated User loading now handled by session store */
  loadUser?: (context: AuthContext, event: AnyEventObject) => Promise<unknown>;
  loadLookups: (
    context: AuthContext,
    event: AnyEventObject
  ) => Promise<unknown>;
  /**
   * Register a new guest-customer via the two-step GUEST_CUSTOMER grant (M5).
   * CLIENT scope only; absent on guest/staff service factories.
   */
  registerAsGuest?: (
    context: AuthContext,
    event: AnyEventObject
  ) => Promise<AuthResult>;
  parse: (context: AuthContext, event: AnyEventObject) => Promise<AuthModel>;
  validate: (context: AuthContext, event: AnyEventObject) => Promise<void>;
};
// -----------------------------------------------------------------------------

/**
 * Payload for the two-step guest registration (M5, FE-2826).
 * NO email field — the guest email is set separately via updateGuestEmail (M5b).
 */
export type RegisterAsGuestPayload = {
  currency_id?: string;
  referral_cookie?: string;
  tracking?: Record<string, unknown>;
};

/**
 * Response from POST clients/register/guest (step 1 of the two-step guest registration).
 */
export type RegisterGuestResponse = {
  id: string;
};

/**
 * Parameters for the email-verification link flow (M2, FE-2826).
 * Passed to auth.services.client.email.ts verifyFromLink / checkVerifyEmail.
 */
export type VerifyFromLinkParams = {
  clientId: string;
  emailId: string;
  hash: string;
};
