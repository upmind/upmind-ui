// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import machineServices, { FetchMethods } from "./services";
// --- utils
import { isEmpty } from "lodash-es";

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
      // ---
      request: null,
      data: null,
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
          { target: "generating", cond: "hasRequest" },
          { target: "processing", cond: "hasRequestPromise" }
        ],
        on: {
          GET: { target: "generating" },
          POST: { target: "generating" },
          PUT: { target: "generating" },
          PATCH: { target: "generating" },
          DELETE: { target: "generating" }
        }
      },

      // Generate the request promise through our service
      generating: {
        entry: ["setRequest"],
        invoke: {
          id: "process",
          src: "generateRequest",
          onDone: { target: "processing", actions: ["setRequestPromise"] },
          onError: { target: "error", actions: ["setError"] }
        }
      },

      // Process the request through our service
      processing: {
        entry: ["clearError"],
        invoke: {
          id: "process",
          src: "useRequest",
          onDone: { target: "processed", actions: ["setResponse"] },
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
          onDone: { target: "processed" },
          onError: { target: "error", actions: ["setError"] }
        }
      },

      // Use a transient state to indicate a successful process
      // We have an imperceptible delay to allow the components to understand the process is complete
      processed: {
        after: {
          100: [{ target: "complete" }]
        }
      },

      // Handle errors
      error: {
        on: {
          RETRY: { target: "processing", actions: ["clearError"] },
          CANCEL: { target: "complete" }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        entry: ["clearRequestPromise"],
        type: "final"
      }
    }
  },
  {
    actions: {
      setRequest: assign((context, { data: { url, init, useCache } }) => {
        debugger;
        return {
          url: url,
          init: init,
          useCache: useCache
        };
      }),

      setRequestPromise: assign((context, { data: { promise } }) => {
        debugger;
        return {
          request: promise
        };
      }),

      clearRequestPromise: assign(({ init, hash }) => {
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

      setResponse: assign(({ init, hash }, { data }) => {
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
      }),

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    services: machineServices,
    guards: {
      hasRequest: ({ url, init }) => {
        return !!url && !!init;
      },

      hasRequestPromise: ({ request }) => {
        return !isEmpty(request);
      }
    }
  }
);
