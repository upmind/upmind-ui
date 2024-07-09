// --- internal
import { useApi } from "../../api";
import { GrantTypes } from "../types.d";
import services from "../services";

// --- utils
import { getTokenfromStorage, persistTokenToStorage } from "../utils";
import { isEmpty } from "lodash-es";

// ---types
import type { GuestContext } from "./types.d";

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
  }).then(data => {
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
      username: model.email,
      password: model.password,
      grant_type: GrantTypes.PASSWORD,
    },
  }).then(data => {
    // we record the history of the token to be able to referejce the originating guest token
    persistTokenToStorage(data, true);
    return data;
  });
}

async function verify2fa({ token }: GuestContext, { data }: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    withAccessToken: token.access_token,
    data: {
      twofa_provider: "google",
      twofa_code: data,
      grant_type: GrantTypes.TWOFA,
    },
  });
}

// --- REGISTER

async function getCustomFields(_context: GuestContext, _event: any) {
  const { get, useUrl } = useApi();
  return get({
    // url: useUrl("clients_fields", { brand_id: null }),
    url: useUrl("clients_fields"),
  }).then(({ data }) => data);
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
  return post({
    url: useUrl("clients/register"),
    data: {
      custom_fields: model?.custom_fields,
      email: model?.email,
      firstname: model?.firstname,
      lastname: model?.lastname,
      password: model?.password,
      phone: model?.phone,
      phone_code: model?.phone_code,
      phone_country_code: model?.phone_country_code,
      recaptcha_token: model?.recaptcha_token,
    },
  }).then(data => {
    persistTokenToStorage(data);
    return data;
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
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
