// --- external

// --- internal
import { useApi } from ".";
import { useSession } from "../session";
import { useI18n } from "../system/i18n";

import type { RequestContext } from "./types";

// --- utils
import { includes, get, set, isEmpty } from "lodash-es";
import {
  getTokenfromStorage,
  persistTokenToStorage,
  dumpTokenFromStorage,
} from "../session/utils";

// --- types
import { GrantTypes } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// --------------------------------------------------------
// ENUMS

export enum FetchMethods {
  DELETE = "DELETE",
  GET = "GET",
  PATCH = "PATCH",
  POST = "POST",
  PUT = "PUT",
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will process the request and return a promise, this WONT allow the request to be cancelled
// TODO: async function doFetch({ url, init }: RequestContext) {
async function doFetch({ url, init }: RequestContext) {
  // safety check, not sure we need this as our machine implementation is pretty strict

  if (!includes(FetchMethods, init?.method)) {
    return Promise.reject(`Invalid method: ${init?.method}`);
  }

  if (!url) return Promise.reject("Invalid URL");

  if (!url.searchParams.has("lang")) {
    const { getLocale } = useI18n();
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
  const data = await response
    .json()
    .then(data => {
      // TODO: transform our responses to ensure we have a consistent data object
      // always in camelCase
      // const safeData = ensureCamelCaseKeys({ ...data });
      // return safeData;

      return data;
    })
    // .catch(error => {
    .catch(() => {
      // console.warn("doFetch response.json error", error);
      return {
        data: null,
      };
    });

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

async function refreshToken(_context: RequestContext, _event: AnyEventObject) {
  const { post, useUrl } = useApi();
  const { reauth } = useSession();

  const token = getTokenfromStorage();
  const refresh_token = get(token, "refresh_token", "");

  // console.debug("refreshToken", "requested");

  return post({
    url: useUrl("access_token", {}, { context: "oauth" }),
    data: {
      grant_type: GrantTypes.REFRESH_TOKEN,
      refresh_token,
    },
  })
    .then((data: any) => {
      // console.debug("refreshToken", "success");
      persistTokenToStorage(data);
      return data;
    })
    .catch(error => {
      // console.debug("refreshToken", "failed", error);

      // we need to notify the session machine that the token is invalid
      // so it can handle the error and decide what to do next
      if (token) dumpTokenFromStorage(token.actor_type);
      reauth();

      return Promise.reject(error);
    });
}

// --------------------------------------------------------
// EXPORTS

export default {
  doFetch,
  refreshToken,
};
