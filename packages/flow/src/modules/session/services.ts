// --- internal
import { useApi } from "../api";

// --- utils
import { get } from "lodash-es";
import { type SessionContext } from "./types.d";

// --------------------------------------------------------
// ENUMS

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
