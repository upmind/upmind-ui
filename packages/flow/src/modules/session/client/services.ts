// --- internal
import { useApi } from "../../api";
import type { ClientContext } from "./types.d";
import { GrantTypes } from "../types.d";

// --- utils
import { get, omit } from "lodash-es";

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(context: ClientContext, _event: any) {
  // if we have a token, we are potentially authenticated
  // and we need to check the token
  const token = get(localStorage, `client/auth/token`);

  return new Promise((resolve, reject) => {
    if (token) {
      return resolve(JSON.parse(token));
    } else {
      return reject();
    }
  });
}

// --- LOGIN

async function authenticate(_context: ClientContext, { data }: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl("access_token", {}, "oauth"),
    data: {
      username: data.username,
      password: data.password,
      grant_type: GrantTypes.PASSWORD
    }
  });
}

async function verify2fa(context: ClientContext, { data }: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl("access_token", {}, "oauth"),
    withAccessToken: context.token.access_token,
    data: {
      twofa_provider: "google",
      twofa_code: data,
      grant_type: GrantTypes.TWOFA
    }
  });
}

// --- REGISTER

async function getCustomFields(_context: ClientContext, { data }: any) {}

async function checkForReCaptcha(_context: ClientContext, { data }: any) {}

async function verifyReCaptcha(_context: ClientContext, { data }: any) {}

async function register(_context: ClientContext, { data }: any) {}

// --- AUTHENTICATED

async function refreshToken(context: ClientContext) {
  const { post, useUrl } = useApi();
  const refresh_token = get(context, "token.refresh_token", "");

  return post({
    url: useUrl("access_token", {}, "oauth"),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token
    }
  });
}

async function persistToken(context: ClientContext, _event: any) {
  const token = omit(context.token, ["actor_id", "actor_type"]);
  token.type = "client";

  if (!localStorage) return Promise.reject("No localStorage available");

  localStorage.setItem(`client/auth/token`, JSON.stringify(token));

  // now remember to destroy any guest token as we are now authenticated
  localStorage.removeItem(`guest/auth/token`);

  return Promise.resolve(); // we dont need to return anything
}

async function dumpToken(context: ClientContext, _event: any) {
  localStorage.removeItem(`client/auth/token`);

  return Promise.resolve(); // we dont need to return anything
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  // ---
  verify2fa,
  authenticate,
  // ---
  getCustomFields,
  checkForReCaptcha,
  verifyReCaptcha,
  register,
  // ---
  refreshToken,
  persistToken,
  dumpToken
};
