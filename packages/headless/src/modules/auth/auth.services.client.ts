/** @internal */
import {
  AccessRoleTypes,
  GrantTypes,
  type IToken
} from "@upmind-automation/types";
import { useRecaptcha } from "../system-recaptcha";
import { useTracking } from "../system-analytics";
import { mapCustomField } from "../client-custom-fields";
import { useBasket } from "../basket";
import { useI18n } from "../system-localisation";
import { useQuery } from "../query";
import { AuthEvents, useSessionStore } from "../session-store";
import { ScopeActorTypes } from "../scope";
import { persistTokenToStorage } from "../session-store/session-store.utils";
import { mapLoginData, mapRecoverData, mapRegisterData } from "./auth.mappers";
import { AUTH_SESSION_QUERY_KEY_BASE, AuthContextTypes } from "./auth.types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCookies
} from "../../utils";
import { map } from "lodash-es";
import type {
  AuthContext,
  AuthResult,
  LoginModel,
  RegisterAsGuestPayload,
  RegisterGuestResponse,
  RegisterModel,
  RecoverModel,
  TwoFAModel
} from "./auth.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module auth/services.client
 * @description Client/Guest authentication services.
 * Contains only client-specific methods. Shared methods are in auth.services.ts.
 *
 * WARNING: Do not import directly. Use via auth machine only.
 */

/**
 * Authenticate client with username/password.
 * Uses GrantTypes.PASSWORD for client authentication.
 * If scopeContext is provided, mints a child client token instead.
 */
async function authenticate(
  context: AuthContext<LoginModel>,
  event: AnyEventObject
): Promise<AuthResult> {
  const { model, scopeContext } = context;
  const { post, useUrl } = useQuery();
  const store = useSessionStore();

  const isChildClient =
    scopeContext?.type === AuthContextTypes.CLIENT && scopeContext?.id;

  const mutationKey: string[] = [
    ...AUTH_SESSION_QUERY_KEY_BASE,
    ScopeActorTypes.CLIENT
  ];
  if (isChildClient)
    mutationKey.push("child", scopeContext.type, scopeContext.id);

  return post<IToken>({
    mutationKey,
    url: isChildClient
      ? useUrl(`clients/${scopeContext.id}/access_token`)
      : useUrl("access_token", {}, { context: "oauth" }),
    data: isChildClient ? undefined : mapLoginData(model, GrantTypes.PASSWORD),
    withAccessToken: true,
    withCurrency: !isChildClient
  }).then(token => {
    // Check if 2FA is required for client
    if (token.actor_type === GrantTypes.TWOFA) {
      return {
        token,
        requires2fa: true,
        twofa_provider: token.twofa_provider
      };
    }

    // Child client login
    if (isChildClient) {
      token.actor_type ||= AccessRoleTypes.CLIENT;
      token.actor_id ||= scopeContext.id;

      const { registerImpersonation } = store.useActions();
      registerImpersonation?.(scopeContext.id);
    } else {
      // Normal client login
      token.actor_type ||= AccessRoleTypes.CLIENT;
    }

    // User loading now handled by session store's add() action. event.type
    // distinguishes the flow — a register.* invocation → "register", else "login".
    persistTokenToStorage(token, {
      event: event.type.includes("register")
        ? AuthEvents.REGISTER
        : AuthEvents.LOGIN
    });
    return { token };
  });
}

/**
 * Verify two-factor authentication code.
 * Uses GrantTypes.TWOFA for client 2FA.
 */
async function verify2fa(
  context: AuthContext<TwoFAModel>,
  _event: AnyEventObject
): Promise<AuthResult> {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();

  return post<IToken>({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.CLIENT],
    url: useUrl("access_token", {}, { context: "oauth" }),
    withAccessToken: context.token?.access_token,
    data: {
      grant_type: GrantTypes.TWOFA,
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
 * Register a new client account.
 * Note: Register endpoint returns user data, not a token.
 * The machine will call authenticate after this to get the token.
 */
async function register(
  context: AuthContext<RegisterModel>,
  _event: AnyEventObject
): Promise<unknown> {
  const { model } = context;
  const { post, useUrl } = useQuery();
  const recaptcha = useRecaptcha();
  const { get: getCookie } = useCookies();
  const { get: getTracking } = useTracking();

  const data = mapRegisterData(model);

  // Add recaptcha token if available
  const recaptchaToken = await recaptcha
    .generate("client_register")
    .catch(() => undefined);
  if (recaptchaToken) data.recaptcha_token = recaptchaToken;

  // add referral cookie if available, NB DO NOT DECODE
  const referralCookie = getCookie("upm_aff", v => v);
  if (referralCookie) data.referral_cookie = referralCookie;

  // Add tracking if available
  const trackingValues = await getTracking().catch(() => undefined);
  if (trackingValues) data.tracking = trackingValues;

  return post({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.CLIENT],
    url: useUrl("clients/register"),
    data,
    withAccessToken: true,
    withCurrency: true
  }).finally(() => {
    recaptcha.clear();
  });
}

/**
 * Register a new guest-customer via the two-step GUEST_CUSTOMER grant (M5).
 *
 * Two sequential awaits:
 * 1. POST clients/register/guest with {currency_id, referral_cookie, tracking}
 *    (NO email — the guest email is set separately via updateGuestEmail, M5b).
 * 2. POST access_token grant_type=GUEST_CUSTOMER with {client_id}.
 *
 * The minted GUEST_CUSTOMER token's actor_type is coerced to CLIENT so the
 * session-store routes the user through the client lifecycle; `is_guest: true`
 * on /self remains the discriminator that distinguishes a guest-customer from
 * a fully-registered client.
 *
 * Step-1 rejection short-circuits step-2 by lexical await order.
 */
async function registerAsGuest(
  _context: AuthContext,
  _event: AnyEventObject
): Promise<AuthResult> {
  const { post, useUrl } = useQuery();
  const { currency } = useBasket();
  const { get: getCookie } = useCookies();
  const { get: getTracking } = useTracking();

  const registerData: RegisterAsGuestPayload = {};
  if (currency.value) registerData.currency_id = currency.value.id;

  const referralCookie = getCookie("upm_aff", v => v);
  if (referralCookie) registerData.referral_cookie = referralCookie as string;

  await getTracking()
    .then(values => (registerData.tracking = values as Record<string, unknown>))
    .catch(() => null);

  const clientResponse = await post<RegisterGuestResponse>({
    mutationKey: [
      ...AUTH_SESSION_QUERY_KEY_BASE,
      ScopeActorTypes.GUEST,
      "register"
    ],
    url: useUrl("clients/register/guest"),
    data: registerData,
    withAccessToken: true
  });

  const clientId =
    (clientResponse as { data?: RegisterGuestResponse })?.data?.id ??
    clientResponse?.id;

  const token = await post<IToken>({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.GUEST],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      client_id: clientId,
      grant_type: GrantTypes.GUEST_CUSTOMER
    },
    withAccessToken: true
  });

  const coerced = { ...token, actor_type: AccessRoleTypes.CLIENT };
  persistTokenToStorage(coerced, { event: AuthEvents.REGISTER });

  return { token: coerced };
}

/**
 * Request password reset email.
 */
async function recover(context: AuthContext<RecoverModel>): Promise<unknown> {
  const { model } = context;
  const recaptcha = useRecaptcha();
  const { post, useUrl } = useQuery();

  const data = mapRecoverData(model);

  // Add recaptcha token if available
  const recaptchaToken = await recaptcha
    .generate("client_register")
    .catch(() => undefined);
  if (recaptchaToken) data.recaptcha_token = recaptchaToken;

  return await post({
    mutationKey: [...AUTH_SESSION_QUERY_KEY_BASE, ScopeActorTypes.CLIENT],
    url: useUrl("clients/password_reset"),
    data
  }).finally(() => {
    recaptcha.clear();
  });
}

/**
 * Load lookups for registration (custom fields).
 * Only applicable for client registration flow.
 */
async function loadLookups(): Promise<unknown[]> {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("clients_fields"),
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
 * Creates client-specific auth services.
 * Shared services (parse, validate) are in auth.services.ts.
 */
export function createClientAuthServices() {
  return {
    authenticate,
    loadLookups,
    recover,
    register,
    registerAsGuest,
    verify2fa
  };
}

export type ClientAuthServices = ReturnType<typeof createClientAuthServices>;
