// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import machineServices, { FetchMethods } from "./services";
import { responseCodes } from "./types.d";
import { useTime } from "../../utils";

// --utils
import { toNumber, set } from "lodash-es";
// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./request.machine.typegen").Typegen0,
    id: "request",
    predictableActionArguments: true,
    initial: "available",
    context: {
      url: null,
      init: null,
      useCache: null,
      hash: null,
      parent: null,
      maxAge: useTime().MINUTE, // 1 minute
      // ---
      created: null,
      completed: null,
      response: null,
      error: null,
      // ---
      attempts: 0
    },
    states: {
      // our initial state depends on how the machine was invoked
      // If we have context > url + init, we can skip to generating
      // If we have context > request, we can skip to processing
      // otherwise we will await a request
      // individual request events are defined to allow for more granular control
      available: {
        always: [
          {
            target: "processing",
            actions: ["setRequest"],
            cond: "hasRequest"
          }
        ],
        on: {
          GET: { target: "processing", actions: ["setRequest"] },
          POST: { target: "processing", actions: ["setRequest"] },
          PUT: { target: "processing", actions: ["setRequest"] },
          PATCH: { target: "processing", actions: ["setRequest"] },
          DELETE: { target: "processing", actions: ["setRequest"] }
        }
      },

      // Process the request through our service
      processing: {
        entry: ["clearError", "clearResponse", "incrementAttempts"],
        id: "processing",
        invoke: {
          id: "process",
          src: "doFetch",
          onDone: {
            target: "processed",
            actions: ["setResponse"]
          },
          onError: { target: "error", actions: ["setError"] }
        },
        on: {
          CANCEL: { target: "cancelling" }
        }
      },

      // Cancel the request through our service
      cancelling: {
        invoke: {
          id: "cancel",
          src: "cancelRequest",
          onDone: { target: "cancelled", actions: [] },
          onError: { target: "error", actions: ["setError"] }
        }
      },

      // Use a transient state to indicate a successful process
      // We have an imperceptible delay to allow the components to understand the process is complete
      // We could also move into a cached state if we have a GET request
      processed: {
        id: "processed",
        initial: "available",
        states: {
          available: {
            after: [
              {
                delay: 0,
                target: "empty",
                cond: "hasNoContent"
              },
              {
                delay: 0,
                target: "cached",
                cond: "isCachable"
              },
              {
                delay: 100,
                target: "#complete"
              }
            ]
          },
          empty: {},
          cached: {
            after: { maxAge: "stale" }, // automatically move to stale after max age
            on: {
              CANCEL: { target: "#complete" }
            }
          },
          stale: {
            after: { wait: "#complete" }, // automatically move to complete after max age
            on: {
              REFRESH: { target: "#processing" },
              CANCEL: { target: "#complete" }
            }
          }
        }
      },

      // Handle cancellation completion, before moving to complete
      cancelled: {
        id: "cancelled"
        // after: {
        //   wait: "#complete" // automatically move to complete after  max age
        // }
      },

      // Handle errors
      error: {
        id: "error",
        initial: "loading",
        states: {
          // detrmine the error type and move to the appropriate state
          // this may kick off a sub state/service to handle the error
          loading: {
            always: [
              {
                target: "#cancelled",
                cond: "hasRetried"
              },
              {
                target: "unauthorized",
                cond: "isUnauthorized"
              },
              {
                target: "forbidden",
                cond: "isForbidden"
              },
              {
                target: "notFound",
                cond: "isNotFound"
              },
              {
                target: "conflict",
                cond: "hasConflict"
              },
              {
                target: "tooManyRequests",
                cond: "hasTooManyRequests"
              },
              { target: "unknown" } // automatically move to complete after  max age
            ]
          },
          // this is for errors we don't know how to handle
          unknown: {
            after: [
              { delay: "wait", target: "#complete" } // automatically move to complete after  max age
            ]
          },
          // if we are unauthorized, we need to attempt to refresh the token
          unauthorized: {
            entry: ["clearError"],
            invoke: {
              src: "doUpdateToken",
              onDone: { actions: ["setAuthHeader"], target: "#processing" },
              onError: { target: "#error", actions: ["setError"] }
            }
          },
          forbidden: {},
          notFound: {},
          conflict: {},
          tooManyRequests: {}
        },

        on: {
          RETRY: {
            target: "processing",
            actions: []
          },
          CANCEL: { target: "#complete" }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      // also send a message to the parent machine to remove the request
      complete: {
        id: "complete",
        entry: ["sendClearRequest"],
        type: "final"
      }
    }
  },
  {
    actions: {
      setRequest: assign(
        (context, { data: { hash, url, init, useCache, maxAge } }) => ({
          hash,
          url,
          init,
          useCache,
          maxAge: maxAge || context.maxAge,
          created: Date.now()
        })
      ),

      setResponse: assign({
        response: (context, { data }) => data,
        completed: () => Date.now()
      }),

      clearResponse: assign({ response: null, completed: null }),

      sendClearRequest: sendParent(({ hash }) => ({
        type: "REMOVE",
        data: { hash }
      })),

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null }),

      incrementAttempts: assign({
        attempts: ({ attempts }) => toNumber(attempts) + 1
      }),

      setAuthHeader: assign({
        init: ({ init }, { data }) => {
          set(init, "headers.Authorization", `Bearer ${data.access_token}`);
          return init;
        }
      })
    },
    services: machineServices,
    guards: {
      hasRequest: ({ url, init }) => !!url && !!init,
      hasRetried: ({ attempts }) => toNumber(attempts) > 1,
      // ---
      isUnauthorized: context => {
        // request
        debugger;
        return context?.error?.status === responseCodes.Unauthorized;
      },
      isForbidden: context =>
        context?.error?.status === responseCodes.Forbidden,
      isNotFound: context => context?.error?.status === responseCodes.Not_Found,
      hasConflict: context => context?.error?.status === responseCodes.Conflict,
      hasTooManyRequests: context =>
        context?.error?.status === responseCodes.Too_Many_Requests,
      // ---
      hasNoContent: ({ response }) =>
        response?.status === responseCodes.No_Content,
      // ---
      isCachable: ({ init, useCache }) =>
        init?.method === FetchMethods.GET && !!useCache
    },
    delays: {
      maxAge: ({ maxAge }) => maxAge, // this allows us to override the max age in the context
      wait: () => useTime().MINUTE // this allows us to wait for a reasonable amount of time before continuing
    }
  }
);
