// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import services from "./services.products";
import { useTime } from "../../utils";

// --utils
import { useBasketParser } from "./utils";
import { isEmpty } from "lodash-es";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with an existing basket product
export default ({ name, basketId, product }) =>
  createMachine(
    {
      tsTypes: {} as import("./item.machine.typegen").Typegen0,
      id: "item",
      predictableActionArguments: true,
      initial: "idle",
      context: {
        name,
        product,
        model: null,
        error: null
      },
      states: {
        idle: {
          always: [{ target: "configuring", cond: "needsConfiguring" }]
        },

        // The product requires configuration
        configuring: {
          // TODO
        },

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
            wait: "idle"
          }
        },

        // The product is being removed from the basket
        clearing: {
          id: "clearing",
          invoke: {
            src: "dump",
            onDone: { target: "#complete" }
          }
        },

        // The product is being updated
        updating: {
          id: "updating",
          invoke: {
            src: "update",
            onDone: { target: "idle", actions: ["setResponse", "clearModel"] },
            onError: { target: "error", actions: ["setError"] }
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
          type: "final"
        }
      },
      on: {
        UPDATE: { target: "updating", actions: ["clearError", "setModel"] },
        REMOVE: { target: "clearing" }
      }
    },
    {
      actions: {
        setModel: assign({
          model: (context, { data }) => data
        }),
        clearModel: assign({
          model: null
        }),
        // ---
        setResponse: assign({
          response: (context, { data }) => useBasketParser(data)
        }),
        clearResponse: assign({
          response: null
        }),
        // ---
        setError: assign({
          error: (context, { data }) => data || "Unknown error"
        }),
        clearError: assign({ error: null })
      },
      services,
      guards: {
        isNew: ({ basket_id, product }) => !!basket_id && !isEmpty(product),

        needsConfiguring: ({ product }) => {
          // provision_setup_field_defer_mode; hidden | inherit | none | optional

          const hasProvider = !!product.provision_provider_id;
          const hasConfig = false; //!!product.config;
          return hasProvider && !hasConfig;
        }
      },
      delays: {
        wait: () => useTime().MILLISECOND * 100 // this allows us to wait for an imperceptible amount of time before continuing
      }
    }
  );

// term
// options
// attributes
// provisioning
