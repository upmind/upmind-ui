// --- external
import { waitFor } from "xstate/lib/waitFor";
import { doneInvoke, error } from "xstate/lib/actions";
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

// this will process the request and return a promise, this WILL allow for the request to be cancelled
const doCancellableFetch =
  ({ url, init }: RequestContext) =>
  async (send, receive) => {
    let requestPromise: any = null;

    // 1: listen for the incoming `CANCEL` event that we forwarded
    receive(({ type }) => {
      debugger;
      if (requestPromise && type === "CANCEL") {
        // 2: Perform the 'clean up' or 'tear down'
        requestPromise.cancel();
        // 3: Now let the machine know we're finished
        debugger;
        send({ type: "CANCELLED" });
      }
    });

    // DO NOT return the promise, or this technique will not work
    requestPromise = fetch(url.toString(), init).catch(error => {
      return Promise.reject(error);
    });

    // consume some data, sending it back to signal that
    // the service is complete (if not cancelled before)

    // maybe instead of catching error, we can check if 204 and return null
    // this catchall seems more robust though
    const response = await requestPromise;

    // Unpack response object
    const { ok, status } = response;

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

    set(data, "status", status); // ensure the correct status code

    // we dont return a promise:- otherwise we cant cancel it
    // so insted we send a message to the machine to let it know we're done
    // with the data or the error
    if (!ok) {
      send(error("process", data));
    } else {
      send(doneInvoke("process", data));
    }
  };

// this will process the request and return a promise, this WONT allow the request to be cancelled
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
  doFetch: doCancellableFetch,
  refreshToken
};
