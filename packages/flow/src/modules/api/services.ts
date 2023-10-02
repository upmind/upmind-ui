// --- internal
import type { RequestParams } from "./types.d";

// --- utils
import { includes } from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum FetchMethods {
  DELETE = "DELETE",
  GET = "GET",
  PATCH = "PATCH",
  POST = "POST",
  PUT = "PUT"
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will process the request and return a promise
async function doFetch({ url, init }: RequestParams) {
  // safety check, not sure we need this as our machine implementation is pretty strict
  if (!includes(FetchMethods, init.method)) {
    throw new Error(`Invalid method: ${init.method}`);
  }

  // do the fetch
  const response = await fetch(url.toString(), init).catch(error => {
    console.error("doFetch error", error);
    Promise.reject(error);
  });

  // Unpack response object
  const { ok, status } = response;

  // Digest response data (JSON)
  // maybe instead of catching error, we can check if 204 and return null
  const data = await response.json().catch(error => {
    console.error("doFetch response.json error", error);
    return null;
  });

  return new Promise((resolve, reject) => {
    if (!ok) {
      reject({ status, data });
    } else {
      resolve({ status, data });
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  doFetch
};
