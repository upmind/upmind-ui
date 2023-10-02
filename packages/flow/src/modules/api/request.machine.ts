// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import machineServices, { FetchMethods } from "./services";
import { useTime } from "../../utils";
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
      error: null
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
            cond: ({ url, init }) => !!url && !!init
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
        entry: ["clearResponse"],
        id: "processing",
        invoke: {
          id: "process",
          src: "doFetch",
          onDone: {
            target: "processed",
            actions: ["setResponse"]
          },
          onError: [
            {
              target: "error.unauthorized",
              actions: ["setError"],
              cond: "isUnauthorized"
            },
            {
              target: "error.forbidden",
              actions: ["setError"],
              cond: "isForbidden"
            },
            {
              target: "error.notFound",
              actions: ["setError"],
              cond: "isNotFound"
            },
            {
              target: "error.conflict",
              actions: ["setError"],
              cond: "isConflict"
            },
            {
              target: "error.tooManyRequests",
              actions: ["setError"],
              cond: "isTooManyRequests"
            },
            { target: "error", actions: ["setError"] }
          ]
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
          onDone: { target: "processed", actions: [] },
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
                target: "cached",
                cond: "isCachable"
              },
              {
                delay: 100,
                target: "#complete"
              }
            ]
          },
          noContent: {},
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

      // Handle errors
      error: {
        id: "error",
        initial: "unknown",
        states: {
          unknown: {
            after: {
              wait: "#complete" // automatically move to complete after  max age
            }
          },
          unauthorized: {
            // tryReAuthentication
          },
          forbidden: {},
          notFound: {},
          conflict: {},
          tooManyRequests: {}
        },

        on: {
          RETRY: { target: "processing", actions: ["clearError"] },
          CANCEL: { target: "#complete" }
        }
      },

      // Handle completion, stop the machine and prevent further requests
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

      // If we are using a GET request, we need to add the promise to the parent
      // this allows us to abort the request if needed or re-use the request if it's already in progress
      // if (init?.method === FetchMethods.GET) {
      // }
      sendClearRequest: sendParent(({ hash }) => ({
        type: "REMOVE",
        data: { hash }
      })),

      setError: assign({
        error: (context, { data }) => {
          debugger;
          return data || "Unknown error";
        }
      })

      // clearError: assign({ error: null })
    },
    services: machineServices,
    guards: {
      isUnauthorized: (_context, { data }) => {
        debugger;
        return data?.status === 401;
      },
      isForbidden: (_context, { data }) => data?.status === 403,
      isNotFound: (_context, { data }) => data?.status === 404,
      isConflict: (_context, { data }) => data?.status === 409,
      isTooManyRequests: (_context, { data }) => data?.status === 429,
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
