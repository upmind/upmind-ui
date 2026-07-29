/** @internal */
import {
  AccessRoleTypes,
  GrantTypes,
  type IToken
} from "@upmind-automation/types";
import { mapCustomField } from "../client-custom-fields";
import { useQuery } from "../query";
import { ScopeActorTypes } from "../scope";
import { AuthEvents, useSessionStore } from "../session-store";
import { persistTokenToStorage } from "../session-store/session-store.utils";
import { useI18n } from "../system-localisation";
import { mapLoginData, mapRecoverData, mapRegisterData } from "./auth.mappers";
import { AUTH_SESSION_QUERY_KEY_BASE, AuthContextTypes } from "./auth.types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { map } from "lodash-es";
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
 * @module auth/services.staff
 * @description Staff authentication services.
 * Contains only staff-specific methods. Shared methods are in auth.services.ts.
 *
 * WARNING: Do not import directly. Use via auth machine only.
 */

/**
 * Authenticate staff with username/password.
 * Uses GrantTypes.ADMIN for staff authentication.
 * If scopeContext is provided, mints an impersonation token instead.
 */
async function authenticate(
  context: AuthContext<LoginModel>,
  _event: AnyEventObject
): Promise<AuthResult> {
  const { model, scopeContext } = context;
  const { post, useUrl } = useQuery();
  const store = useSessionStore();

  const isImpersonation =
    scopeContext?.type === AuthContextTypes.CLIENT && scopeContext?.id;

  const mutationKey: string[] = [
    ...AUTH_SESSION_QUERY_KEY_BASE,
    ScopeActorTypes.STAFF
  ];
  if (isImpersonation)
    mutationKey.push("impersonate", scopeContext.type, scopeContext.id);

  return post<IToken>({
    mutationKey,
    url: isImpersonation
      ? useUrl(`admin/clients/${scopeContext.id}/access_token`)
      : useUrl("access_token", {}, { context: "oauth" }),
    data: isImpersonation ? undefined : mapLoginData(model, GrantTypes.ADMIN),
    withAccessToken: true
  }).then(token => {
    // Check if 2FA is required for staff
    if (token.actor_type === GrantTypes.TWOFA_ADMIN) {
      return { token, requires2fa: true, twofa_provider: token.twofa_provider };
    }
    // Impersonated staff login
    if (isImpersonation) {
      token.actor_type ||= AccessRoleTypes.CLIENT;
      token.actor_id ||= scopeContext.id;

      const { registerImpersonation } = store.useActions();
      registerImpersonation?.(scopeContext.id);
    } else {
      // Normal staff login
      token.actor_type ||= AccessRoleTypes.STAFF;
    }

    // User loading now handled by session store's add() action
    persistTokenToStorage(token, { event: AuthEvents.LOGIN });
    return { token };
  });
}

/**
 * Verify two-factor authentication code for staff.
 * Uses GrantTypes.TWOFA_ADMIN for staff 2FA.
 */
async function verify2fa(
  context: AuthContext<TwoFAModel>,
  _event: AnyEventObject
): Promise<AuthResult> {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();

  return post<IToken>({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.STAFF],
    url: useUrl("access_token", {}, { context: "oauth" }),
    withAccessToken: context.token?.access_token,
    data: {
      grant_type: GrantTypes.TWOFA_ADMIN,
      twofa_code: context.model?.token
    }
  })
    .then(token => {
      // User loading now handled by session store's add() action
      persistTokenToStorage(token, { event: AuthEvents.LOGIN });
      return { token };
    })
    .catch(error => {
      return Promise.reject(
        new DetailedError(
          error.message || t("error.twofa_not_valid"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Upmind,
          { token: error.message || t("error.token_not_available") }
        )
      );
    });
}

/**
 * Register a new staff/org account.
 * Uses the org registration endpoint.
 */
async function register(
  context: AuthContext<RegisterModel>,
  _event: AnyEventObject
): Promise<unknown> {
  const { model } = context;
  const { post, useUrl } = useQuery();

  const data = mapRegisterData(model);

  return post({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.STAFF],
    url: useUrl("org/register"),
    data
  });
}

/**
 * Request staff password reset email.
 * Uses the admin users password reset endpoint.
 */
async function recover(
  context: AuthContext<RecoverModel>,
  _event: AnyEventObject
): Promise<unknown> {
  const { model } = context;
  const { post, useUrl } = useQuery();

  const data = mapRecoverData(model);

  return post({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.STAFF],
    url: useUrl("admin/users/password_reset"),
    data
  });
}

/**
 * Staff Load lookups for registration (custom fields).
 * Only applicable for staff registration flow.
 */
async function loadLookups(): Promise<unknown[]> {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("org/clients_fields"),
    queryKey: [
      ...AUTH_SESSION_QUERY_KEY_BASE,
      ScopeActorTypes.CLIENT,
      "custom-fields"
    ],
    select: (data: unknown[]) => map(data ?? [], mapCustomField)
  });
}
// -----------------------------------------------------------------------------
// Factory Export

/**
 * Creates staff-specific auth services.
 * Shared services (parse, validate) are in auth.services.ts.
 */
export function createStaffAuthServices() {
  return {
    authenticate,
    loadLookups,
    recover,
    register,
    verify2fa
  };
}

export type StaffAuthServices = ReturnType<typeof createStaffAuthServices>;
