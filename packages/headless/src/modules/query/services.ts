// --- external

// --- internal
import { useQuery } from ".";
import { useSession } from "../session";
import { messageDisplays, messageTypes, useFeedback } from "../feedback";
import { useLocale } from "../system";
// --- utils
import {
  get,
  includes,
  isEmpty,
  map,
  set,
  startsWith,
  upperCase
} from "lodash-es";
import {
  dumpTokenFromStorage,
  getTokenFromStorage,
  persistTokenToStorage
} from "../session/utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import type { Token } from "../session/types";
import { GrantTypes, Methods } from "@upmind-automation/types";
import type { QueryResponse, RequestParams } from "./types";

const { add } = useFeedback();

// -----------------------------------------------------------------------------
function handleError(
  status: QueryResponse["status"],
  error: QueryResponse["error"]
): Promise<never> {
  // of we have a system error, we want to add some feedback for the ui
  if (
    includes(
      [responseCodes.Forbidden, responseCodes.Too_Many_Requests],
      status
    ) ||
    status >= 500
  ) {
    add({
      type: messageTypes.ERROR,
      title: "Service temporarily unavailable",
      copy: "Service temporarily down for maintenance",
      data: { ...error, status },
      i18nKey: `errors.${status ?? responseCodes.Service_Unavailable}`,
      display: messageDisplays.SYSTEM,
      delay: 0,
      maxAge: 0
    });
  }

  throw new DetailedError(
    error?.message ?? "Service temporarily unavailable",
    status || responseCodes.Service_Unavailable,
    ErrorOrigin.Upmind,
    error?.data
  );
}

async function doFetch<T extends any = any>({
  url,
  init
}: RequestParams): Promise<QueryResponse<T>> {
  init ??= {};

  if (!includes(map(Methods, upperCase), init?.method)) {
    return Promise.reject(
      new DetailedError(
        `Invalid method: ${init?.method}`,
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
        "Invalid URL",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  if (
    init.method == Methods.GET.toUpperCase() &&
    !url.searchParams.has("lang") &&
    !startsWith(url.pathname, "/oauth/")
  ) {
    const { locale } = useLocale();
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

      return data as QueryResponse<T>;
    })
    .catch(response => {
      // Aborted requests are handled differently and do not throw an error
      if (
        response.status == responseCodes.Aborted ||
        response.code == responseCodes.Aborted ||
        response.name == "AbortError"
      )
        return Promise.reject();

      // DC: change this as when we get service cors errors, we dont get a response object with status
      // so we need to handle it differently, and that  genrally means the API is down

      return handleError(
        response.status ?? responseCodes.Service_Unavailable,
        response?.error ?? response
      );
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
