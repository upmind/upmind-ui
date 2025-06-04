// --- external

// --- internal
import { useQuery } from ".";
import { useSession } from "../session";
import { useFeedback } from "../feedback";
import { useSystemI18n } from "../system";
const { add } = useFeedback();

// --- utils
import {
  get,
  map,
  set,
  isEmpty,
  includes,
  upperCase,
  startsWith,
} from "lodash-es";
import {
  getTokenFromStorage,
  dumpTokenFromStorage,
  persistTokenToStorage,
} from "../session/utils";
import { responseCodes } from "../../utils";
import { messageDisplays, messageTypes } from "../feedback";

// --- types
import type { Token } from "../session/types";
import { GrantTypes, Methods } from "@upmind-automation/types";
import type { RequestParams, Response } from "./types";

// -----------------------------------------------------------------------------
function handleError(
  status: Response["status"],
  error: Response["error"]
): Promise<never> {
  // of we have a server error (5xx), we want to display a system message
  if (status >= 500 && status < 600) {
    add({
      type: messageTypes.ERROR,
      title: "Service temporarily unavailable",
      copy: "Service temporarily down for maintenance",
      data: error,
      i18nKey: `errors.${status ?? responseCodes.Service_Unavailable}`,
      display: messageDisplays.SYSTEM,
      delay: 0,
      maxAge: 0,
    });
  }

  return Promise.reject({
    status: status || responseCodes.Service_Unavailable,
    data: null,
    total: null,
    error: {
      id: error?.id ?? null,
      type: error?.type ?? responseCodes.Service_Unavailable,
      code: error?.code ?? null,
      message: error?.message || "Service temporarily unavailable",
      data: error?.data || null,
    },
    messages: null,
  });
}

async function doFetch<T extends any = any>({
  url,
  init,
}: RequestParams): Promise<T> {
  init ??= {};

  if (!includes(map(Methods, upperCase), init?.method)) {
    return Promise.reject(new Error(`Invalid method: ${init?.method}`));
  }

  if (!url) return Promise.reject(new Error("Invalid URL"));

  if (!url.searchParams.has("lang") && !startsWith(url.pathname, "/oauth/")) {
    const { locale, isReady } = useSystemI18n();
    await isReady();
    if (!isEmpty(locale.value))
      url.searchParams.set("lang", locale.value as string);
  }

  // do the fetch
  return fetch(url.toString(), init)
    .then(async response => {
      const { ok, status } = response;

      const data = await response.json().catch(() => ({ data: null }));

      set(data, "status", status); // ensure the correct status code

      if (!ok) throw data;

      return data as T;
    })
    .catch(response => {
      if (!response?.status) return Promise.reject();
      return handleError(response.status, response?.error);
    });
}

async function refreshToken() {
  const { reauth } = useSession();
  const { post, useUrl } = useQuery();

  const token = getTokenFromStorage();
  const refresh_token = get(token, "refresh_token", "");

  return post<Token>({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token,
    },
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

      return Promise.reject(error);
    });
}

// -----------------------------------------------------------------------------

export { doFetch, refreshToken };
