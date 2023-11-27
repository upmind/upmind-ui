// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useSession } from "../session";

import type { RequestContext } from "./types.d";

// --- utils
import { includes, get, set } from "lodash-es";

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

  if (!includes(FetchMethods, init?.method)) {
    Promise.reject(`Invalid method: ${init?.method}`);
  }

  // do the fetch
  const response = await fetch(url.toString(), init).catch(error => {
    Promise.reject(error);
  });

  // Digest response data (JSON)
  // maybe instead of catching error, we can check if 204 and return null
  // this catchall seems more robust though
  const data = await response
    .json()
    .then(data => {
      // TODO: transform our responses to ensure we have a consistent data object
      // always in camelCase
      // const safeData = ensureCamelCaseKeys({ ...data });
      // console.log("api response", "ensureCamelCaseKeys", { data, safeData });
      // return safeData;

      return data;
    })
    .catch(error => {
      console.warn("doFetch response.json error", error);
      return {
        data: null
      };
    });

  return new Promise((resolve, reject) => {
    // Unpack response object
    const { ok, status } = response;

    // add status to data object
    set(data, "status", status); // ensure the correct status code

    if (!ok) {
      reject(data);
    } else {
      resolve(data);
    }
  });
}

async function refreshToken(_context: RequestContext, _event: any) {
  const { getSnapshot, service: sessionService } = useSession();

  // start by getting the current service and state
  // kick off the auth process
  sessionService.send("REFRESH");

  // wait for the service to complete
  await waitFor(sessionService, newState =>
    ["client.idle", "guest.idle", "client.error", "guest.error"].some(
      newState.matches
    )
  ).catch(error => {
    return Promise.reject(error);
  });

  // return the token or error
  return new Promise((resolve, reject) => {
    // get the current state
    const state = getSnapshot();
    if (["client.idle", "guest.idle"].some(state.matches)) {
      resolve(state.context.token);
    } else {
      const error = get(state, "context.error");
      reject(error);
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  doFetch,
  refreshToken
};
