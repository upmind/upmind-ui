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

async function getUser(context: SessionContext, event: any) {
  const { get, useUrl } = useApi();

  return get({
    url: useUrl("self", {
      with: [
        "actor",
        "accounts"
        // client specific only
        // "actor.account", // Relation required for determining `topup_enabled` value
        // "actor.brand", // Relation required for determining `topup_enabled` value
        // "delegated_ids",
        // "enabled_modules"
      ].join()
    }),
    withAccessToken: true
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
  getUser
};
