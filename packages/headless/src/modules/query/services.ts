// --- external

// --- internal
import { useI18n } from "../system";
import { useSession } from "../session";
import { handleError, isAbortError, useQuery } from ".";

// --- utils
import { get, map, set, includes, upperCase } from "lodash-es";
import {
  getTokenFromStorage,
  dumpTokenFromStorage,
  persistTokenToStorage
} from "../session/utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import type { Token } from "../session/types";
import { GrantTypes, Methods } from "@upmind-automation/types";
import type { QueryResponse, RequestParams } from "./types";
import { messageDisplays, messageTypes, useFeedback } from "../feedback";

// -----------------------------------------------------------------------------

async function doFetch<T extends any = any>({
  url,
  init
}: RequestParams): Promise<QueryResponse<T>> {
  init ??= {};
  const { t } = useI18n();

  if (!includes(map(Methods, upperCase), init?.method)) {
    return Promise.reject(
      new DetailedError(
        t("error.http_method_not_valid", { method: init?.method }),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        {
          url: url?.toString(),
          method: init?.method
        }
      )
    );
  }

  if (!url)
    await Promise.reject(
      new DetailedError(
        t("error.url_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // do the fetch
  return fetch(url.toString(), init)
    .then(async response => {
      const { ok, status } = response;

      const data = await response.json().catch(() => ({ data: null }));

      set(data, "status", status); // ensure the correct status code

      if (!ok) throw data;

      return data as QueryResponse<T>;
    })
    .catch(response => {
      // Aborted requests are handled differently and do not throw an error
      if (isAbortError(response)) return Promise.reject();

      // DC: change this as when we get service cors errors, we don't get a response object with status,
      // so we need to handle it differently, and that generally means the API is down
      return handleError(
        response.status ?? responseCodes.Unknown,
        response?.error ?? response
      );
    });
}

async function refreshToken() {
  const { reauth } = useSession();
  const { post, useUrl } = useQuery();
  const { t } = useI18n();

  const token = getTokenFromStorage();
  const refresh_token = get(token, "refresh_token", "");

  if (!token || !refresh_token) {
    useFeedback().add({
      type: messageTypes.ERROR,
      title: t("error.401_title_md"),
      copy: t("error.401_text"),
      data: { status: responseCodes.Unauthorized },
      display: messageDisplays.INTERSTITIAL,
      delay: 0,
      maxAge: 0
    });

    // reauth();
    // return Promise.reject(
    //   new DetailedError(
    //     "No Auth token found",
    //     responseCodes.Unauthorized,
    //     ErrorOrigin.Headless
    //   )
    // );
  }

  return post<Token>({
    mutationKey: ["session"],
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token
    }
  })
    .then(data => {
      persistTokenToStorage(data as unknown as Token);
      return data;
    })
    .catch(error => {
      // we need to notify the session machine that the token is invalid
      // so it can handle the error and decide what to do next
      if (token) dumpTokenFromStorage(token.actor_type);
      reauth();

      //  propagate the error
      throw error;
    });
}

// -----------------------------------------------------------------------------

export { doFetch, refreshToken };
