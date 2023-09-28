// --- internal
import { useApi } from "../api";

// --- utils
import { get, omit } from "lodash-es";
import { type BasketContext, GrantTypes } from "./types.d";

// --------------------------------------------------------
// ENUMS
// enum GrantTypes {
//   ADMIN = "admin",
//   ADMIN_PASSWORD_RESET = "admin_password_reset",
//   COMPLETE_ORG_REGISTRATION = "complete_org_registration",
//   COMPLETE_USER_REGISTRATION = "complete_user_registration",
//   COMPLETE_REGISTRATION = "complete_registration",
//   GUEST = "guest",
//   GUEST_CUSTOMER = "guest_customer",
//   PASSWORD = "password",
//   PASSWORD_RESET = "password_reset",
//   REFRESH_TOKEN = "refresh_token",
//   TWOFA_ADMIN = "twofa-admin",
//   TWOFA = "twofa"
// }

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(context: BasketContext, _event: any) {
  // TODO: This needs to evolve to check for a valid token
  // and if it is valid, check if it is expired
  // if it is expired, reject with a refresh error
  // if it is not expired, resolve with the token
  // Also, when wh have client logins, we need to check for a valid token thats not guest

  const basketContext = get(context, "role", "guest");

  const token = get(localStorage, `${basketContext}/auth/token`);

  return new Promise((resolve, reject) => {
    if (token) {
      return resolve(JSON.parse(token));
    } else {
      return reject();
    }
  });
}

async function generateToken(_context: BasketContext, _event: any) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl("access_token", "oauth"),
    data: { grant_type: GrantTypes.GUEST }
  });
}

async function refreshToken(context: BasketContext, _event: any) {
  const { post, useUrl } = useApi();
  const refresh_token = get(context, "token.refresh_token", "");

  return await post({
    url: useUrl("access_token", "oauth"),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token
    }
  });
}

async function persistToken(context: BasketContext, _event: any) {
  const basketContext = get(context, "role", "guest");
  const token = omit(context.token, ["actor_id", "actor_type"]);

  if (!localStorage) return Promise.reject("No localStorage available");

  localStorage.setItem(`${basketContext}/auth/token`, JSON.stringify(token));

  // Deprecated: we are now storing the entire token in localStorage as opposed to individual keys
  // forEach(token, (value, key) => {
  //   localStorage.setItem(
  //     `${basketContext}/auth/token/${key}`,
  //     isNil(value) ? "" : value.toString()
  //   );
  // });

  return Promise.resolve(); // we dont need to return anything
}

async function dumpToken(context: BasketContext, _event: any) {
  const basketContext = get(context, "role", "guest");

  localStorage.removeItem(`${basketContext}/auth/token`);

  // localStorage.removeItem(`${basketContext}/auth/token/access_token`);
  // localStorage.removeItem(`${basketContext}/auth/token/refresh_token`);
  // localStorage.removeItem(`${basketContext}/auth/token/token_type`);
  // localStorage.removeItem(`${basketContext}/auth/token/created_at`);
  // localStorage.removeItem(`${basketContext}/auth/token/expires_in`);
  // localStorage.removeItem(`${basketContext}/auth/token/second_factor_required`);
  // localStorage.removeItem(`${basketContext}/auth/token/refresh_expires_in`);

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
