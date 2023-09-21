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
function generateRequest(
  context: RequestContext,
  { data: { url, init } }: RequestEvent
) {
  // safety check, not sure we need this as our machine implementation is pretty strict
  if (!includes(FetchMethods, init.method)) {
    throw new Error(`Invalid method: ${init.method}`);
  }

  const request = () => fetch(url, init);

  // return the generated request promise to be used in the machine
  return Promise.resolve(request);
}

function useRequest({ request }: RequestContext) {
  // Process the actual request
  return request().then(async response => {
    // Digest response data (JSON)
    const data = await response.json();
    // Unpack response object
    const { ok, status } = response;
    // If response was not OK, reject promise
    if (!ok) return Promise.reject({ status, data });

    // Resolve the promise
    return { status, data };
  }); //request();
}

function useCache(
  { requests, cache }: RequestsContext,
  { hash }: { hash: string }
) {
  // 1st: return existing request promise (if found)
  const reqPromise = get(requests, hash);
  if (reqPromise) return reqPromise;

  // 2nd: Get cached response (if any)
  // NB: logic to clean up cache happens in actions on receiving the message to fetch
  const cachedResponse = get(cache, hash);

  // return cached result (if found)
  return new Promise((resolve, reject) => {
    if (cachedResponse) return resolve(cachedResponse);
    else return reject();
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  useCache,
  generateRequest,
  useRequest
};
