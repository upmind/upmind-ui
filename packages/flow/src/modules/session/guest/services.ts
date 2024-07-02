// --- internal
import { useApi } from "../../api";
import type { GuestContext } from "./types.d";
import { GrantTypes } from "../types.d";

// --- utils
import { getTokenfromStorage, persistTokenToStorage } from "../utils";
import { isEmpty } from "lodash-es";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(_context: GuestContext, _event: any) {
  const token = getTokenfromStorage("guest");

  return new Promise((resolve, reject) => {
    if (!isEmpty(token)) {
      resolve(token);
    } else {
      reject(null);
    }
  });
}

async function generateToken(_context: GuestContext, _event: any) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: { grant_type: GrantTypes.GUEST },
  }).then(({ data }) => {
    persistTokenToStorage(data, "guest");
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
  }).then(({ data }) => {
    persistTokenToStorage(data, "client");
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
  }).then(({ data }) => {
    persistTokenToStorage(data, "client");
    return data;
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  generateToken,
  // ---
  verify2fa,
  authenticate,
  // ---
  getCustomFields,
  checkForReCaptcha,
  verifyReCaptcha,
  register,
};
