// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useSession } from "../session";
import type { RequestParams, RequestContext } from "./types.d";

// --- utils
import { includes, get } from "lodash-es";

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
  const response = await fetch(url.toString(), init).catch(error => {
    console.error("doFetch error", error);
    Promise.reject(error);
  });

  // Unpack response object
  const { ok, status } = response;

  // Digest response data (JSON)
  // maybe instead of catching error, we can check if 204 and return null
  const data = await response.json().catch(error => {
    console.warn("doFetch response.json error", error);
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

async function doAuth(_context: RequestContext, _event: any) {
  // start by getting the current service and state
  let { service, state } = useSession();

  // then watch for changes to the state
  service.onTransition(s => (state = s));

  // now check if we have a stale token, if we do, refresh it
  if (state.matches("processed")) {
    service.send("REFRESH");
  }

  if (state.matches("processing")) {
    await waitFor(service, s =>
      ["processed", "cancelled", "error.unknown"].some(s.matches)
    ).catch(error => {
      return Promise.reject(error);
    });
  }

  return new Promise((resolve, reject) => {
    if (state.matches("processed.available")) {
      resolve(state.context.token);
    }
    if (["cancelled", "error"].some(state.matches)) {
      const error = get(state, "context.error");
      reject(error);
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  doFetch,
  doAuth
};
