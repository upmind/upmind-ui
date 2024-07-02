// --- internal
import { useApi } from "../../api";
import type { ClientContext } from "./types.d";
import { GrantTypes } from "../types.d";

// --- utils
import { isEmpty } from "lodash-es";
import { getTokenfromStorage, persistTokenToStorage } from "../utils";

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(_context: ClientContext, _event: any) {
  // if we have a token, we are potentially authenticated
  // and we need to check the token

  const token = getTokenfromStorage("client");

  return new Promise((resolve, reject) => {
    if (!isEmpty(token)) {
      resolve(token);
    } else {
      reject(null);
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
};
