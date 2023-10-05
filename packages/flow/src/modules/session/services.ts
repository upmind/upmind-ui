// --- internal
import { useApi } from "../api";

// --- utils
import { get, omit } from "lodash-es";
import { type SessionContext, GrantTypes } from "./types.d";

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

async function check(context: SessionContext, _event: any) {
  const clientToken = get(localStorage, `client/auth/token`);
  const guestToken = get(localStorage, `guest/auth/token`);

  const token = clientToken || guestToken;

  return new Promise((resolve, reject) => {
    if (token) {
      return resolve(JSON.parse(token));
    } else {
      return reject();
    }
  });
}

async function dumpGuestToken(context: SessionContext, event: any) {
  localStorage.removeItem(`guest/auth/token`);
  return Promise.resolve(); // we dont need to return anything
}

async function dumpClientToken(context: SessionContext, event: any) {
  localStorage.removeItem(`client/auth/token`);
  return Promise.resolve(); // we dont need to return anything
}

async function dumpTokens(context: SessionContext, event: any) {
  localStorage.removeItem(`client/auth/token`);
  localStorage.removeItem(`guest/auth/token`);

  return Promise.resolve(); // we dont need to return anything
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  dumpTokens,
  dumpGuestToken,
  dumpClientToken
};
