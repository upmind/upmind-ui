// --- internal
import { useQuery } from "../..";

// --- utils
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { getTokenFromStorage, persistTokenToStorage } from "./utils";

import { isEmpty } from "lodash-es";

// --- types
import { GrantTypes, IToken } from "@upmind-automation/types";
import type { SessionContext } from "./types";

// -----------------------------------------------------------------------------

async function check(_context: SessionContext) {
  const token = getTokenFromStorage();
  return new Promise((resolve, reject) => {
    if (!isEmpty(token)) {
      resolve(token);
    } else {
      reject(
        new DetailedError(
          "[headless] token is not available",
          responseCodes.Not_Found,
          ErrorOrigin.Headless,
          null
        )
      );
    }
  });
}

async function transferTo(_context: SessionContext) {
  const { post, useUrl } = useQuery();

  return post({
    url: useUrl("auth_code"),
    withAccessToken: true
  });
}

async function transferFrom({ transfer }: SessionContext) {
  const { post, useUrl } = useQuery();

  if (!transfer?.code)
    return Promise.reject(
      new DetailedError(
        "[headless] No code",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        transfer
      )
    );

  return post<IToken>({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.AUTH_CODE,
      code: transfer.code,
      lang: "en" // ensure we dont init i18n to get the locale
    }
  }).then(data => {
    persistTokenToStorage(data);
    return data;
  });
}

// -----------------------------------------------------------------------------

export default {
  check,
  transferTo,
  transferFrom
};
