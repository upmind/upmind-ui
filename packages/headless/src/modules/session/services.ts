// --- internal
import { useQuery } from "../..";

// --- utils
import { getTokenFromStorage } from "./utils";
import { isEmpty } from "lodash-es";

// --- types
import type { SessionContext } from "./types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(_context: SessionContext, _event: any) {
  const token = getTokenFromStorage();
  return new Promise((resolve, reject) => {
    if (!isEmpty(token)) {
      resolve(token);
    } else {
      reject(null);
    }
  });
}

async function transfer(_context: SessionContext, _event: any) {
  const { post, useUrl } = useQuery();

  return post({
    url: useUrl("auth_code"),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  check,
  transfer,
};
