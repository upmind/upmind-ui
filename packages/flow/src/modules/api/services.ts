// --- internal
import type { RequestContext } from "./types";

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
async function doFetch({ url, init }: RequestContext) {
  // safety check, not sure we need this as our machine implementation is pretty strict
  if (!includes(FetchMethods, init.method)) {
    throw new Error(`Invalid method: ${init.method}`);
  }

  // do the fetch
  const response = await fetch(url, init).catch(error => {
    console.error("doFetch error", error);
    Promise.reject(error);
  });

  // Digest response data (JSON)
  const data = await response.json();

  // Unpack response object
  const { ok, status } = response;

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
