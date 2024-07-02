// --- internal
import { useApi } from "../api";

// --- utils
import { get, isEmpty } from "lodash-es";
import {
  getTokenfromStorage,
  persistTokenToStorage,
  useUserParser,
} from "./utils";

// --- types
import type { SessionContext } from "./types.d";
import { GrantTypes } from "./types.d";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(_context: SessionContext, _event: any) {
  const token = getTokenfromStorage();
  return new Promise((resolve, reject) => {
    if (!isEmpty(token)) {
      resolve(token);
    } else {
      reject(null);
    }
  });
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
  }).then(({ data }) => useUserParser(data?.actor));
}

async function transfer(_context: SessionContext, _event: any) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl("auth_code"),
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function refreshToken(_context: SessionContext) {
  const { post, useUrl } = useApi();
  const token = getTokenfromStorage();
  const refresh_token = get(token, "refresh_token", "");
  debugger;

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token,
    },
  }).then(data => {
    persistTokenToStorage(data);
    return data;
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  refreshToken,
  getUser,
  transfer,
};
