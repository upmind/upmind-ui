// import { Url } from "url";
// --- utils
import { includes, get } from "lodash-es";

// --------------------------------------------------------

import type { RequestsContext, RequestContext, RequestEvent } from "./types";

// --------------------------------------------------------
// ENUMS

export enum FetchMethods {
  GET = "GET",
  DELETE = "DELETE",
  POST = "POST",
  PUT = "PUT"
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will generate the actual request promise
// we do this so we can store the request in context
// which allows us to abort the request if needed
// or re-use the request if it's already in progress
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
