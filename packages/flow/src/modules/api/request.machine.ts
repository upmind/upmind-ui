// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import machineServices, { FetchMethods } from "./services";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./request.machine.typegen").Typegen0,
    id: "request",
    predictableActionArguments: true,
    initial: "idle",
    context: {
      url: null,
      init: null,
      useCache: null,
      hash: null,
      parent: null,
      maxAge: 6000, // 1 minute
      // ---
      response: null,
      error: null
    },
    states: {
      // our initial state depends on how the machine was invoked
      // If we have context > url + init, we can skip to generating
      // If we have context > request, we can skip to processing
      // otherwise we will await a request
      // individual request events are defined to allow for more granular control
      idle: {
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
          onDone: { target: "processed", actions: ["clearResponse"] },
          onError: { target: "error", actions: ["setError"] }
        }
      },

      // Use a transient state to indicate a successful process
      // We have an imperceptible delay to allow the components to understand the process is complete
      // We could also move into a cached state if we have a GET request
      processed: {
        id: "processed",
        initial: "idle",
        states: {
          idle: {
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
          cached: {
            after: { maxAge: "stale" }, // automatically move to stale after max age
            on: {
              CANCEL: { target: "#complete" }
            }
          },
          stale: {
            on: {
              REFRESH: { target: "#processing" },
              CANCEL: { target: "#complete" }
            }
          }
        },
        on: {
          RETRY: { target: "processing", actions: ["clearResponse"] },
          CANCEL: { target: "#complete" }
        }
        // after: {
        //   100: [{ target: "#complete" }]
        // }
      },

      // Handle errors
      error: {
        after: {
          maxAge: "#complete" // automatically move to complete after  max age
        },
        on: {
          RETRY: { target: "processing", actions: ["clearError"] },
          CANCEL: { target: "#complete" }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        entry: ["sendClearRequest", "clearResponse"],
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
          maxAge: maxAge || context.maxAge
        })
      ),

      setResponse: assign({ response: (context, { data }) => data }),

      clearResponse: assign({ response: null }),

      // If we are using a GET request, we need to add the promise to the parent
      // this allows us to abort the request if needed or re-use the request if it's already in progress
      // if (init?.method === FetchMethods.GET) {
      // }
      sendClearRequest: sendParent(({ hash }) => ({
        type: "REMOVE",
        data: { hash }
      })),

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    services: machineServices,
    guards: {
      isCachable: ({ init }) => init?.method === FetchMethods.GET
    },
    delays: {
      maxAge: ({ maxAge }) => maxAge // this allows us to override the max age in the context
    }
  }
);
