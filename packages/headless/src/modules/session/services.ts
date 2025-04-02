// --- internal
import { useQuery } from "../..";

// --- utils
import { getTokenFromStorage } from "./utils";
import { isEmpty } from "lodash-es";

// --- types
import type { SessionContext } from "./types";

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

export default {
  check,
  transfer,
};
