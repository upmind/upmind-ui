import { sha1 } from "object-hash";
import { assign, sendTo, sendParent, spawn } from "xstate";
// ---
import { addMeta, getMaxAge } from "./utils";
import requestMachine from "./request.machine";
import type {
  RequestContext,
  RequestsContext,
  RequestEvent,
  RequestsEvents,
  RequestEvents
} from "./types";
import { FetchMethods } from "./services";
// ---
import { set, get, unset, omit, upperCase } from "lodash-es";

// --------------------------------------------------------

function generateHash(url: string, init: RequestInit) {
  const hash = sha1({ ...omit(init, ["signal"]), url });
  return hash;
}

export default <Object>{
  // ------------------------------------
  // REQUEST ACTIONS

  setHash: assign((context, { data: { url, init } }: RequestEvents) => ({
    hash: generateHash(url, init)
  })),

  setRequest: assign(
    (context, { data: { url, init, useCache } }: RequestEvents) => {
      debugger;
      return {
        url: url,
        init: init,
        useCache: useCache
      };
    }
  ),

  setRequestPromise: assign((context, { data: { promise } }: RequestEvents) => {
    debugger;
    return {
      request: promise
    };
  }),

  clearRequestPromise: assign(({ init, hash }: RequestContext) => {
    debugger;
    // If we are using a GET request, we need to add the promise to the parent
    // this allows us to abort the request if needed or re-use the request if it's already in progress
    // if (init?.method === FetchMethods.GET) {
    sendParent({ type: "REMOVE", data: { hash } });
    // }

    // finally update our context with the request promise
    return {
      request: null
    };
  }),

  setResponse: assign(
    ({ init, hash }: RequestContext, { data }: RequestEvents) => {
      debugger;

      // If we are using a GET request, we need to add the response to the parent's cache
      // this allows us to re-use the response if it is not stale
      if (init?.method === FetchMethods.GET) {
        sendParent({ type: "STASH", data: { hash, data } });
      }

      // finally update our context with the response data
      return {
        data
      };
    }
  ),

  // ------------------------------------
  // PARENT REQUESTS MANAGER ACTIONS

  add: assign({
    requests: (
      { requests }: RequestsContext,
      { data: { url, init, useCache } }: RequestsEvents
    ) => {
      const hash = generateHash(url, init);

      // spawn an actor for the new request
      const machine = spawn(requestMachine, {
        name: hash,
        sync: true
      });

      // todo check if the request is already in progress or cached
      // if so, we can skip the request and either:
      // 1. return the cached request's data
      // 2. return the request in progress

      // for now well just add the new machine to our list
      set(requests, hash, machine);

      // and then forward the request to the new machine to process
      sendTo(hash, {
        type: upperCase(init.method),
        data: { url, init, useCache }
      });

      return requests;
    }
  }),

  remove: assign({
    requests: (
      { requests }: RequestsContext,
      { data: { hash } }: RequestsEvents
    ) => {
      // try find any requests with the same hash
      const request = get(requests, hash);

      // if it exists, stop the referenced machine
      // and remove it from our list of requests
      if (request) {
        request.stop();
        unset(requests, hash);
      }

      return requests;
    }
  }),

  forward: (
    { requests }: RequestsContext,
    { type, data: { hash } }: RequestsEvents
  ) => {
    debugger;
    sendTo(hash, { type });
  },

  stash: assign({
    cache: (
      { cache }: RequestsContext,
      { data: { hash, data } }: RequestsEvents
    ) => {
      addMeta(data, "maxAge", getMaxAge());
      set(cache, hash, data);
      return cache;
    }
  }),

  dumpStale: assign({
    cache: ({ cache }: RequestsContext, { data: { hash } }: RequestsEvents) => {
      debugger;
      const cached = get(cache, hash);

      // Dump if NOT within Max Age
      if (cached?._maxAge < new Date()) unset(cache, hash);

      return cache;
    }
  }),

  dump: assign({
    cache: ({ cache }: RequestsContext, { data: { hash } }: RequestsEvents) => {
      debugger;
      unset(cache, hash);
      return cache;
    }
  }),

  // ------------------------------------
  // ERROR HANDLING

  setError: assign({
    error: (context, { data }: { data: Error }) =>
      data?.message || data || "Unknown error"
  }),

  clearError: assign({ error: null })
};
