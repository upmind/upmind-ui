// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-security
 * @description Four-layer contract for the `client-security` module headless
 * does not have yet (plan §3): the account's own sign-in posture — when the
 * password last changed, whether a second step is asked for at sign-in, and
 * the three writes that move either fact. The USERNAME lives on
 * `client-personal-details`, which owns the profile record, not here.
 *
 * @decision The password is never READ. A client-facing module can state its
 * age and nothing else, which is why the context carries a timestamp rather
 * than a value.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — Security →
 * change password and two-factor authentication
 * (`changePasswordForm.vue`, `twoFactorAuthForm.vue`); gap-doc rows
 * "4. Account → Security".
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  ResponseError
} from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the posture — whose sign-in security is addressed. */
export const ClientSecurityContextTypes = {
  /** Acting on a client's own sign-in security. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientSecurityContextTypes =
  (typeof ClientSecurityContextTypes)[keyof typeof ClientSecurityContextTypes];

/**
 * Scope matrix for `useClientSecurity`. `client` is the only actor that
 * resolves: nobody changes somebody else's password.
 */
export const CLIENT_SECURITY_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientSecurityContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientSecurity`. */
export type ClientSecurityScopeMatrix = typeof CLIENT_SECURITY_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/** What the change-password form writes. */
export type SecurityPasswordModel = {
  password: string;
  passwordConfirm: string;
};

/** What the two-factor dialog writes — the code from the client's authenticator. */
export type SecurityTwoFactorModel = {
  token: string;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientSecurity
// -----------------------------------------------------------------------------

/** Security context — the posture, as facts the page can state. */
export type UseClientSecurityContext = {
  /** When the password last changed; the age the security panel prints. */
  passwordChangedAt: ComputedRef<string>;
  /** Whether a second step is asked for at sign-in. */
  twoFactorEnabled: ComputedRef<boolean>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Security meta — one computed per state flag. */
export type UseClientSecurityMeta = {
  /** True if a read or a write failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True while the posture is loading. */
  isLoading: ComputedRef<boolean>;
  /** True while a write is in flight. */
  isProcessing: ComputedRef<boolean>;
};

/** Security actions — the three writes, plus lifecycle. */
export type UseClientSecurityActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the posture can be read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the posture from the server. */
  refresh: () => Promise<void>;
  /** Sets a new password; the confirm must match. */
  changePassword: (model: SecurityPasswordModel) => Promise<void>;
  /** Turns the second sign-in step on, against a code from the client's authenticator. */
  enableTwoFactor: (model: SecurityTwoFactorModel) => Promise<void>;
  /** Turns the second sign-in step off. */
  /**
   * Turns the second step off. Legacy asked for the code on the way OUT as
   * well as the way in — its DELETE carried the same `auth_code` its POST did
   * (`configure2faModal.vue:112-124`).
   */
  disableTwoFactor: (model: SecurityTwoFactorModel) => Promise<void>;
};

/** Security internals (debugging) — exempt from conformance. */
export type UseClientSecurityInternals = ContractInternals;
