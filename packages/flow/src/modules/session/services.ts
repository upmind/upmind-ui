// --- internal
import { useApi } from "../api";

// --- utils
import { get, isEmpty } from "lodash-es";
import { useUserParser } from "./utils";

// --- types
import { type SessionContext } from "./types.d";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(_context: SessionContext, _event: any) {
  const clientToken = get(localStorage, `client/auth/token`);
  const guestToken = get(localStorage, `guest/auth/token`);

  const token = clientToken || guestToken;

  return new Promise((resolve, reject) => {
    if (token) {
      resolve(JSON.parse(token));
    } else {
      reject(null);
    }
  });
}

async function dumpGuestToken(_context: SessionContext, _event: any) {
  localStorage.removeItem(`guest/auth/token`);
  return Promise.resolve(); // we dont need to return anything
}

async function dumpClientToken(_context: SessionContext, _event: any) {
  localStorage.removeItem(`client/auth/token`);
  return Promise.resolve(); // we dont need to return anything
}

async function dumpTokens(_context: SessionContext, _event: any) {
  localStorage.removeItem(`client/auth/token`);
  localStorage.removeItem(`guest/auth/token`);

  return Promise.resolve(); // we dont need to return anything
}

async function getUser(_context: SessionContext, _event: any) {
  const { get, useUrl } = useApi();

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
    withAccessToken: true,
  })
    .then(({ data }) => useUserParser(data?.actor))
    .then(data => {
      // if (isEmpty(data)) debugger; //TODO try trace a race condition on refresh token
      return data;
    });

  // const self = await dispatch(
  //   "api/call",
  //   {
  //     method: Methods.GET,
  //     path: "api/self",
  //     requestConfig: {
  //       params: {
  //         with: [
  //           "actor",
  //           "actor.account", // Relation required for determining `topup_enabled` value
  //           "actor.brand", // Relation required for determining `topup_enabled` value
  //           "accounts",
  //           "delegated_ids",
  //           "enabled_modules"

  //         ].join()
  //       }
  //     }
  //   },
  //   { root: true }
  // );
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  dumpTokens,
  dumpGuestToken,
  dumpClientToken,
  getUser,
};
