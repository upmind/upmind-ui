// --- external

// --- internal
import { useSystemI18n } from "../system";
import { useQuery } from ".";
import { useSession } from "../session";

// --- utils
import {
  getTokenFromStorage,
  persistTokenToStorage,
  dumpTokenFromStorage,
} from "../session/utils";
import { get, set, isEmpty, includes, map, upperCase } from "lodash-es";

// --- types
import type { Token } from "../session/types";
import { GrantTypes, Methods } from "@upmind-automation/types";
import { RequestParams } from "./types";

// -----------------------------------------------------------------------------

async function doFetch<T extends object = object>({
  url,
  init,
}: RequestParams): Promise<T> {
  if (!includes(map(Methods, upperCase), init?.method)) {
    return Promise.reject(`Invalid method: ${init?.method}`);
  }

  if (!url) return Promise.reject("Invalid URL");

  if (!url.searchParams.has("lang")) {
    const { getLocale } = useSystemI18n();
    const locale = await getLocale();
    if (!isEmpty(locale)) url.searchParams.set("lang", locale as string);
  }

  // do the fetch
  const response = await fetch(url.toString(), init).catch(error => {
    return Promise.reject(error);
  });

  const { ok, status } = response;

  // Digest response data (JSON)
  // maybe instead of catching error, we can check if 204 and return null
  // this catchall seems more robust though
  const data = (await response
    .json()
    .then(data => data)
    .catch(() => ({ data: null }))) as T;

  return new Promise((resolve, reject) => {
    // Unpack response object

    // add status to data object
    set(data, "status", status); // ensure the correct status code

    if (ok) {
      resolve(data);
    } else {
      reject(data);
    }
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
