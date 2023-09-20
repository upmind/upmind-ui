import { createMachine } from "xstate";
// ---
import actions from "./actions";
import services from "./services";

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
      data: null
    },
    states: {
      // our initial state depends on how the machine was invoked
      // If we have context > url + init, we can skip to generating
      // If we have context > request, we can skip to processing
      // otherwise we will await a request
      // individual request events are defined to allow for more granular control
      idle: {
        always: [
          { target: "generating", cond: "isBeforeNoon" },
          { target: "processing", cond: "isBeforeNoon" }
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
        invoke: {
          id: "process",
          src: "generateRequest",
          onDone: { target: "processing", actions: ["setPromise"] },
          onError: { target: "error", actions: ["setError"] }
        }
      },

      // Process the request through our service
      processing: {
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
    actions,
    services
  }
);
