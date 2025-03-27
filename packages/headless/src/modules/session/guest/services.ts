// --- internal
import { useQuery } from "../..";
import { useSystemRecaptcha, useTracking, useDataLayer } from "../../system/";
import { GrantTypes, TwofaProviders } from "@upmind-automation/types";

// --- utils
import { useCookies } from "../../../utils";
import { getTokenFromStorage, persistTokenToStorage } from "../utils";
import { isEmpty } from "lodash-es";

// ---types
import type { GuestContext } from "./types";

// -----------------------------------------------------------------------------

async function load(_context: GuestContext, _event: any) {
  // if we DONT have a token, we need to generate one, otherwise we are authenticated already
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

async function authenticate({ model }: GuestContext) {
  const { post, useUrl } = useQuery();
  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      username: model.username,
      password: model.password,
      grant_type: GrantTypes.PASSWORD,
    },
  })
    .then((data: any) => {
      // we record the history of the token to be able to referejce the originating guest token
      if (data.actor_type != GrantTypes.TWOFA) persistTokenToStorage(data);
      return data;
    })
    .then(loadUser);
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
  }).then(({ data }: any) => data);
}

async function checkForReCaptcha(_context: GuestContext, { data }: any) {
  // not implemented so pass through
  return Promise.resolve(data);
}

async function verifyReCaptcha(_context: GuestContext, { data }: any) {
  // not implemented so pass through
  return Promise.resolve(data);
}

async function register({ model }: GuestContext) {
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
    phone: model?.phone,
    phone_code: model?.phone_code,
    phone_country_code: model?.phone_country_code,
  };

  // ---
  // Conditional data

  // add recaptcha token if available
  await recaptcha
    .generate("client_register")
    .then(token => (data.recaptcha_token = token))
    .catch(() => null);

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
    .then(({ data }: any) => data)
    .then(loadUser);
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
  register,
};
