// --- internal
import { useBasket, useBrand, useI18n, useQuery, useSystem } from "../..";
import { useRecaptcha, useTracking } from "../../system/";
import {
  BrandConfigKeys,
  Contexts,
  GrantTypes,
  type IToken,
  TwofaProviders
} from "@upmind-automation/types";

// --- utils
import { isEmpty, map } from "lodash-es";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCookies,
  useValidation
} from "../../../utils";
import { getTokenFromStorage, persistTokenToStorage } from "../utils";

// ---types
import type {
  GuestContext,
  LoginModel,
  RecoverModel,
  RegisterGuestResponse,
  RegisterModel,
  TWOFAModel
} from "./types";
import type { AnyEventObject } from "xstate";
import { mapCustomField } from "../../client/customFields/mappers";

// -----------------------------------------------------------------------------

async function load(_context: GuestContext, _event: AnyEventObject) {
  const { ensureConfig } = useBrand();
  const { fetchCountries } = useSystem();

  await Promise.allSettled([
    fetchCountries(),
    ensureConfig([BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION])
  ]);

  const token = getTokenFromStorage(Contexts.GUEST);
  if (!isEmpty(token)) return Promise.resolve(token);

  const { post, useUrl } = useQuery();

  return post<IToken>({
    mutationKey: ["session"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: { grant_type: GrantTypes.GUEST }
  }).then(data => {
    persistTokenToStorage(data);
    return data;
  });
}

async function loadUser() {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("self", {
      with: [
        "actor",
        "accounts"
        // client specific only
        // "actor.account", // Relation required for determining `topup_enabled` value
        // "actor.brand", // Relation required for determining `topup_enabled` value
        // "delegated_ids",
        // "enabled_modules"
      ].join()
    }),
    queryKey: ["session", "self"],
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });
}

async function authenticate({ model }: GuestContext<LoginModel>) {
  const { post, useUrl } = useQuery();
  const { currency } = useBasket();

  const data: any = {
    username: model.username,
    password: model.password,
    grant_type: GrantTypes.PASSWORD
  };

  // Add.match the basket currency (if available)
  // to persist the currency when a client logs in and claims a basket
  // without it, the basket will revert to the default currency
  if (currency.value) data.currency_id = currency.value.id;

  return post<IToken>({
    mutationKey: ["session"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data
  }).then(data => {
    // we record the history of the token to be able to reference the originating guest token
    if (data.actor_type === GrantTypes.TWOFA) return data;

    persistTokenToStorage(data);
    return loadUser();
  });
}

async function verify2fa({ token }: GuestContext, { data }: AnyEventObject) {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();
  return post<IToken>({
    mutationKey: ["session"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    withAccessToken: token.access_token,
    data: {
      grant_type: GrantTypes.TWOFA,
      twofa_code: (data as TWOFAModel).token
    }
  })
    .then(data => {
      persistTokenToStorage(data);
      return data;
    })
    .catch(error => {
      return Promise.reject(
        new DetailedError(
          error.message || t("error.twofa_not_valid"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Upmind,
          {
            token: error.message || t("error.token_not_available")
          }
        )
      );
    })
    .then(loadUser);
}

async function getCustomFields(_context: GuestContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("clients_fields", {
      "filter[show_on_order_form]": true
    }),
    queryKey: ["session", "client", "custom-fields"],
    select: data => map(data ?? [], mapCustomField)
  });
}

async function register({ model }: GuestContext<RegisterModel>) {
  const { currency } = useBasket();
  const { post, useUrl } = useQuery();
  const recaptcha = useRecaptcha();
  const { get: getCookie } = useCookies();
  const { get: getTracking } = useTracking();

  const data: any = {
    custom_fields: model?.customFields,
    email: model?.username,
    username: model?.username,
    firstname: model?.firstname,
    lastname: model?.lastname,
    password: model?.password,
    phone: model.phone?.nationalNumber,
    phone_code: model.phone?.countryCallingCode,
    phone_country_code: model.phone?.country
  };

  // ---
  // Conditional data

  // Add.match the basket currency (if available)
  // to persist the currency when a client registers and claims a basket
  // without it, the basket will revert to the default currency
  if (currency.value) data.currency_id = currency.value.id;

  // add recaptcha token if available
  await recaptcha
    .generate("client_register")
    .then(token => (data.recaptcha_token = token))
    .catch(() => null); // do nothing

  // add referral cookie if available, NB DO NOT DECODE
  const referralCookie = getCookie("upm_aff", v => v);
  if (referralCookie) data.referral_cookie = referralCookie;

  // add tracking if available
  await getTracking()
    .then(values => (data.tracking = values))
    .catch(() => null);

  // ---

  return post<IToken>({
    mutationKey: ["session"],
    url: useUrl("clients/register"),
    data,
    withAccessToken: true
  })
    .then(loadUser)
    .finally(() => {
      recaptcha.clear(); // clear our recaptcha token that has been used, even if the registration fails
    });
}

async function registerAsGuest(_context: GuestContext, _event: AnyEventObject) {
  const { post, useUrl } = useQuery();
  const { currency } = useBasket();
  const { get: getCookie } = useCookies();
  const { get: getTracking } = useTracking();

  const registerData: any = {};
  if (currency.value) registerData.currency_id = currency.value.id;

  const referralCookie = getCookie("upm_aff", v => v);
  if (referralCookie) registerData.referral_cookie = referralCookie;

  await getTracking()
    .then(values => (registerData.tracking = values))
    .catch(() => null);

  const clientResponse = await post<RegisterGuestResponse>({
    mutationKey: ["session", "guest", "register"],
    url: useUrl("clients/register/guest"),
    data: registerData,
    withAccessToken: true
  });

  const clientId = clientResponse?.data?.id ?? clientResponse?.id;
  const token = await post<IToken>({
    mutationKey: ["session"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      client_id: clientId,
      grant_type: GrantTypes.GUEST_CUSTOMER
    },
    withAccessToken: true
  });

  persistTokenToStorage({ ...token, actor_type: Contexts.CLIENT });

  return loadUser();
}

async function recover({ model }: GuestContext<RecoverModel>) {
  const recaptcha = useRecaptcha();
  const { post, useUrl } = useQuery();

  const data: any = {
    username: model?.username
  };

  // add recaptcha token if available
  await recaptcha
    .generate("client_register")
    .then(token => (data.recaptcha_token = token))
    .catch(() => null); // do nothing

  return post({
    mutationKey: ["session"],
    url: useUrl("clients/password_reset"),
    data
  }).finally(() => {
    recaptcha.clear(); // clear our recaptcha token that has been used, even if the registration fails
  });
}

async function validate(
  { schema, model }: GuestContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.auth_not_valid"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  // ---
  validate,
  verify2fa,
  authenticate,
  // ---
  getCustomFields,
  recover,
  register,
  registerAsGuest
};
