// --- internal
import { useApi } from "../api";
import { GrantTypes } from "./types.d";

// --- utils
import {
  dumpTokensFromStorage,
  getTokenfromStorage,
  persistTokenToStorage,
} from "./utils";
import { isEmpty, get } from "lodash-es";

// --- types
import type { SessionContext } from "./types.d";

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

async function refreshToken(_context: SessionContext) {
  const { post, useUrl } = useApi();
  const token = getTokenfromStorage();
  const refresh_token = get(token, "refresh_token", "");

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token,
    },
  })
    .then(data => {
      persistTokenToStorage(data);
      return data;
    })
    .catch(error => {
      dumpTokensFromStorage();
      return Promise.reject(error);
    });
}

async function transfer(_context: ClientContext, _event: any) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl("auth_code"),
    withAccessToken: true,
  }).then(({ data }) => data);
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  refreshToken,
  transfer,
};
