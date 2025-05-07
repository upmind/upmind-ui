// --- internal
import { useQuery } from "../..";

// --- utils
import { DetailedError, responseCodes } from "../../utils";
import { getTokenFromStorage, persistTokenToStorage } from "./utils";

import { isEmpty } from "lodash-es";

// --- types
import { GrantTypes } from "@upmind-automation/types";
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

async function transferTo(_context: SessionContext, _event: any) {
  const { post, useUrl } = useQuery();

  return post({
    url: useUrl("auth_code"),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function transferFrom({ transfer }: SessionContext, _event: any) {
  const { post, useUrl } = useQuery();

  if (!transfer?.code)
    return Promise.reject(
      new DetailedError("No code", responseCodes.Unprocessable_Entity, transfer)
    );

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.AUTH_CODE,
      code: transfer.code,
    },
  }).then((data: any) => {
    persistTokenToStorage(data);
    return data;
  });
}

// -----------------------------------------------------------------------------

export default {
  check,
  transferTo,
  transferFrom,
};
