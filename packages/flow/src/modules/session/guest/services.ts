// --- internal
import { useApi } from "../../api";
import type { GuestContext } from "./types.d";
import { GrantTypes } from "../types.d";

// --- utils
import { get, omit } from "lodash-es";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(context: GuestContext, _event: any) {
  const token = get(localStorage, `guest/auth/token`);

  return new Promise((resolve, reject) => {
    if (token) {
      return resolve(JSON.parse(token));
    } else {
      return reject();
    }
  });
}

async function generateToken(_context: GuestContext, _event: any) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl("access_token", {}, "oauth"),
    data: { grant_type: GrantTypes.GUEST }
  });
}

async function refreshToken(context: GuestContext, _event: any) {
  const { post, useUrl } = useApi();
  const refresh_token = get(context, "token.refresh_token", "");

  return await post({
    url: useUrl("access_token", {}, "oauth"),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token
    }
  });
}

async function persistToken(context: GuestContext, _event: any) {
  const token = omit(context.token, ["actor_id", "actor_type"]);
  token.type = "guest";

  if (!localStorage) return Promise.reject("No localStorage available");

  localStorage.setItem(`guest/auth/token`, JSON.stringify(token));

  return Promise.resolve(); // we dont need to return anything
}

async function dumpToken(context: GuestContext, _event: any) {
  localStorage.removeItem(`guest/auth/token`);
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
