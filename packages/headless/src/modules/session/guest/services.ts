// --- internal
import { useBasket, useBrand, useQuery, useSystem } from "../..";
import { useSystemRecaptcha, useTracking } from "../../system/";
import {
  BrandConfigKeys,
  GrantTypes,
  TwofaProviders,
} from "@upmind-automation/types";

// --- utils
import { isEmpty } from "lodash-es";
import { useCookies } from "../../../utils";
import { getTokenFromStorage, persistTokenToStorage } from "../utils";

// ---types
import { GuestContext, LoginModel, RecoverModel, RegisterModel } from "./types";

// -----------------------------------------------------------------------------

async function load(_context: GuestContext, _event: any) {
  const { ensureConfig } = useBrand();
  const { fetchCountries } = useSystem();

  await Promise.allSettled([
    fetchCountries(),
    ensureConfig([BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION]),
  ]);

  const token = getTokenFromStorage("guest");
  if (!isEmpty(token)) return Promise.resolve(token);

  const { post, useUrl } = useQuery();

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: { grant_type: GrantTypes.GUEST },
  }).then((data: any) => {
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
        "accounts",
        // client specific only
        // "actor.account", // Relation required for determining `topup_enabled` value
        // "actor.brand", // Relation required for determining `topup_enabled` value
        // "delegated_ids",
        // "enabled_modules"
      ].join(),
    }),
    queryKey: ["session", "self"],
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0,
  }).then(({ data }: any) => {
    return data;
  });
}

async function authenticate({ model }: GuestContext<LoginModel>) {
  const { post, useUrl } = useQuery();
  const { getCurrency } = useBasket();

  const data: any = {
    username: model.username,
    password: model.password,
    grant_type: GrantTypes.PASSWORD,
  };

  // Add.match the basket currency (if available)
  // to persist the currency when a client logs in and claims a basket
  // without it, the basket will revert to the default currency
  const currency = getCurrency();
  if (currency) data.currency_id = currency.id;

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data,
  })
    .then((data: any) => {
      // we record the history of the token to be able to reference the originating guest token
      if (data.actor_type != GrantTypes.TWOFA) persistTokenToStorage(data);
      return data;
    })
    .then(data => {
      if (data?.actor_type === GrantTypes.TWOFA) return data;
      return loadUser();
    });
}

async function verify2fa({ token }: GuestContext, { data }: any) {
  const { post, useUrl } = useQuery();
  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    withAccessToken: token.access_token,
    data: {
      grant_type: GrantTypes.TWOFA,
      twofa_provider: TwofaProviders.GOOGLE,
      twofa_code: data,
    },
  })
    .then((data: any) => {
      persistTokenToStorage(data);
      return data;
    })
    .then(loadUser);
}

async function getCustomFields(_context: GuestContext, _event: any) {
  const { get, useUrl } = useQuery();

  return get({
    // url: useUrl("clients_fields", { brand_id: null }),
    url: useUrl("clients_fields"),
    queryKey: ["session", "guest", "custom-fields"],
  }).then(({ data }: any) => {
    return data.map((field: any) => {
      if (field.type_code === "image" || field.type_code === "input_file") {
        field.options = {
          ...field.options,
          field: {
            field_id: field.id,
            field_type: "client_custom_field",
            field_is_default: false,
          },
        };
      }
      return field;
    });
  });
}

async function checkForReCaptcha(_context: GuestContext, { data }: any) {
  // not implemented so pass through
  return Promise.resolve(data);
}

async function verifyReCaptcha(_context: GuestContext, { data }: any) {
  // not implemented so pass through
  return Promise.resolve(data);
}

async function register({ model }: GuestContext<RegisterModel>) {
  const { getCurrency } = useBasket();
  const { post, useUrl } = useQuery();
  const recaptcha = useSystemRecaptcha();
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
    phone_country_code: model.phone?.country,
  };

  // ---
  // Conditional data

  // Add.match the basket currency (if available)
  // to persist the currency when a client registers and claims a basket
  // without it, the basket will revert to the default currency
  const currency = getCurrency();
  if (currency) data.currency_id = currency.id;

  // add recaptcha token if available
  await recaptcha
    .generate("client_register")
    .then(token => (data.recaptcha_token = token))
    .catch(() => null); // do nothing

  // add referral cookie if available
  const referralCookie = getCookie("upm_aff");
  if (referralCookie) data.referral_cookie = referralCookie;

  // add tracking if available
  await getTracking()
    .then(values => (data.tracking = values))
    .catch(() => null);

  // ---

  return post({
    url: useUrl("clients/register"),
    data,
  })
    .then(({ data }: any) => {
      recaptcha.clear(); // clear our recaptcha token that has been used
      return data;
    })
    .then(loadUser);
}

async function recover({ model }: GuestContext<RecoverModel>) {
  const recaptcha = useSystemRecaptcha();
  const { post, useUrl } = useQuery();

  const data: any = {
    username: model?.username,
  };

  // add recaptcha token if available
  await recaptcha
    .generate("client_register")
    .then(token => (data.recaptcha_token = token))
    .catch(() => null); // do nothing

  return post({
    url: useUrl("clients/password_reset"),
    data,
  }).then(({ data }: any) => {
    recaptcha.clear(); // clear our recaptcha token that has been used
    return data;
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  // ---
  verify2fa,
  authenticate,
  // ---
  getCustomFields,
  checkForReCaptcha,
  verifyReCaptcha,
  recover,
  register,
};
