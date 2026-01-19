// --- external

// --- internal
import { useI18n, useQuery } from "../..";

// --- utils
import { isEmpty } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { getTokenFromStorage, persistTokenToStorage } from "./utils";

// --- types
import { GrantTypes, type IToken } from "@upmind-automation/types";
import type { SessionContext } from "./types";

// -----------------------------------------------------------------------------

async function check(_context: SessionContext) {
  const { post, useUrl } = useQuery();
  const token = getTokenFromStorage();

  if (!isEmpty(token)) {
    return Promise.resolve(token);
  } else {
    // generate/persist the new guest token immediately
    return post<IToken>({
      mutationKey: ["session"],
      url: useUrl("access_token", {}, { context: "oauth" }),
      data: { grant_type: GrantTypes.GUEST }
    }).then(data => {
      persistTokenToStorage(data);
      return data;
    });
  }
}

async function transferTo(_context: SessionContext) {
  const { post, useUrl } = useQuery();

  return post({
    mutationKey: ["session", "transfer_to"],
    url: useUrl("auth_code"),
    withAccessToken: true
  });
}

async function transferFrom({ transfer }: SessionContext) {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();

  if (!transfer?.code)
    return Promise.reject(
      new DetailedError(
        t("error.session_transfer_code_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        transfer
      )
    );

  return post<IToken>({
    mutationKey: ["session", "transfer_from"],
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
