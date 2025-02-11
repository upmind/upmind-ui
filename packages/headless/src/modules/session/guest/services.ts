// --- internal
import { useApi } from "../../api";
import { useSystemRecaptcha } from "../../system/recaptcha";
import { GrantTypes, TwofaProviders } from "../types";

// --- utils
import { useCookies, useTracking } from "../../../utils";
import { getTokenfromStorage, persistTokenToStorage } from "../utils";
import { isEmpty } from "lodash-es";

// ---types
import type { GuestContext } from "./types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function load(_context: GuestContext, _event: any) {
  // if we DONT have a token, we need to generate one, otherwise we are authenticated already
  const token = getTokenfromStorage("guest");
  if (!isEmpty(token)) return Promise.resolve(token);

  const { post, useUrl } = useApi();

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: { grant_type: GrantTypes.GUEST },
  }).then((data: any) => {
    persistTokenToStorage(data);
    return data;
  });
}

// --- LOGIN

async function authenticate({ model }: GuestContext) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      username: model.username,
      password: model.password,
      grant_type: GrantTypes.PASSWORD,
    },
  }).then((data: any) => {
    // we record the history of the token to be able to referejce the originating guest token
    if (data.actor_type != GrantTypes.TWOFA) persistTokenToStorage(data);
    return data;
  });
}

async function verify2fa({ token }: GuestContext, { data }: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    withAccessToken: token.access_token,
    data: {
      grant_type: GrantTypes.TWOFA,
      twofa_provider: TwofaProviders.GOOGLE,
      twofa_code: data,
    },
  }).then((data: any) => {
    persistTokenToStorage(data);
    return data;
  });
}

// --- REGISTER

async function getCustomFields(_context: GuestContext, _event: any) {
  const { get, useUrl } = useApi();
  return get({
    // url: useUrl("clients_fields", { brand_id: null }),
    url: useUrl("clients_fields"),
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
  const { post, useUrl } = useApi();
  const recaptcha = useSystemRecaptcha();
  const { getCookie } = useCookies();
  const { getTracking } = useTracking();

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
  await getCookie("upm_aff")
    .then(value => (data.referral_cookie = value))
    .catch(() => null);

  // add tracking if available
  await getTracking()
    .then(values => (data.tracking = values))
    .catch(() => null);

  // ---

  return post({
    url: useUrl("clients/register"),
    data,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

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
