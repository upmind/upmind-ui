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

// login!
async function generateToken(_context: ClientContext, { data }: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl("access_token", {}, "oauth"),
    data
  });
}

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
  generateToken,
  refreshToken,
  persistToken,
  dumpToken
};
