// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import services from "./services.products";
import { useTime } from "../../utils";

// --utils
import { useBasketParser } from "./utils";
// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./product.machine.typegen").Typegen0,
    id: "product",
    predictableActionArguments: true,
    initial: "available",
    context: {
      id: null,
      basket_id: null,
      product: null,
      response: null,
      error: null
    },
    states: {
      available: {
        always: [
          {
            target: "processing",
            actions: ["setProduct"],
            cond: "hasProduct"
          }
        ],
        on: {
          ADD: { target: "processing", actions: ["setProduct"] }
        }
      },

      // Process the product through our service
      processing: {
        entry: ["clearError"],
        id: "processing",
        invoke: {
          id: "process",
          src: "add",
          onDone: {
            target: "processed",
            actions: ["setResponse"]
          },
          onError: { target: "error", actions: ["setError"] }
        }
      },

      // Use a transient state to indicate a successful process
      // We have an imperceptible delay to allow the components to understand the process is complete
      processed: {
        id: "processed",
        after: {
          wait: "#complete"
        }
      },

      // Handle errors
      error: {
        id: "error"
      },

      // Handle completion, stop the machine and prevent further products
      // also send a message to the parent machine to remove the product
      complete: {
        id: "complete",
        entry: ["sendRemoveMessage"],
        type: "final"
      }
    }
  },
  {
    actions: {
      setProduct: assign((context, { data }) => data),

      setResponse: assign({
        response: (context, { data }) => useBasketParser(data)
      }),

      sendRemoveMessage: sendParent(({ id, response }) => ({
        type: "KILL",
        data: { id, data: response }
      })),

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    services,
    guards: {
      hasProduct: ({ product_id }) => !!product_id
    },
    delays: {
      wait: () => useTime().MILLISECOND * 100 // this allows us to wait for an imperceptible amount of time before continuing
    }
  }
);
