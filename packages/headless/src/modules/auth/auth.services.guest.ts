/** @internal */
import {
  AccessRoleTypes,
  GrantTypes,
  type IToken
} from "@upmind-automation/types";
import { useQuery } from "../query";
import { ScopeActorTypes } from "../scope";
import { persistTokenToStorage } from "../session-store";
import { AUTH_SESSION_QUERY_KEY_BASE } from "./auth.types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import type {
  AuthContext,
  AuthResult,
  LoginModel,
  RecoverModel,
  RegisterModel,
  TwoFAModel
} from "./auth.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module auth/services.guest
 * @description Guest authentication services.
 * Contains only guest-specific methods. Shared methods are in auth.services.ts.
 *
 * WARNING: Do not import directly. Use via auth machine only.
 */

/**
 * Mint a guest token.
 * Uses GrantTypes.GUEST for anonymous session creation.
 */
async function authenticate(
  _context: AuthContext<LoginModel>,
  _event: AnyEventObject
): Promise<AuthResult> {
  const { post, useUrl } = useQuery();

  return post<IToken>({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.GUEST],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: { grant_type: GrantTypes.GUEST }
  }).then(token => {
    token.actor_type ||= AccessRoleTypes.GUEST;

    persistTokenToStorage(token);
    return { token };
  });
}

/**
 * Guest verify2fa - not supported.
 * Guest sessions do not require two-factor authentication.
 */
async function verify2fa(
  _context: AuthContext<TwoFAModel>,
  _event: AnyEventObject
): Promise<never> {
  throw new DetailedError(
    "2FA not available for guest sessions",
    responseCodes.Forbidden,
    ErrorOrigin.Headless
  );
}

/**
 * Guest register - not supported.
 * Guests cannot self-register; use client auth flow instead.
 */
async function register(
  _context: AuthContext<RegisterModel>,
  _event: AnyEventObject
): Promise<never> {
  throw new DetailedError(
    "Registration not available for guest sessions",
    responseCodes.Forbidden,
    ErrorOrigin.Headless
  );
}

/**
 * Guest recover - not supported.
 * Guests do not have credentials to recover.
 */
async function recover(
  _context: AuthContext<RecoverModel>,
  _event: AnyEventObject
): Promise<never> {
  throw new DetailedError(
    "Password recovery not available for guest sessions",
    responseCodes.Forbidden,
    ErrorOrigin.Headless
  );
}

/**
 * Load guest lookups - resolves undefined.
 * Guests have no registration lookups.
 */
async function loadLookups(
  _context: AuthContext,
  _event: AnyEventObject
): Promise<undefined> {
  return Promise.resolve(undefined);
}
// -----------------------------------------------------------------------------
// Factory Export

/**
 * Creates guest-specific auth services.
 * Shared services (parse, validate) are in auth.services.ts.
 */
export function createGuestAuthServices() {
  return {
    authenticate,
    loadLookups,
    recover,
    register,
    verify2fa
  };
}

export type GuestAuthServices = ReturnType<typeof createGuestAuthServices>;
