// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import services from "./services";
import configMachine from "./productConfig.machine";
import { useBasketParser } from "./utils";
// --utils
import { useTime } from "../../utils";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with an existing basket product
export default ({ basketId, productId }) =>
  createMachine(
    {
      tsTypes: {} as import("./item.machine.typegen").Typegen0,
      id: "item",
      predictableActionArguments: true,
      initial: "configuring",
      context: {
        basketId,
        productId, // this is the product that requires configuring/adding to basket
        // ---
        config: {}, // this is the product config, which will be added to the basket
        response: null, // this is the response from the basket, once it has been added
        // ---
        error: null
      },
      states: {
        // first load our product

        // The product requires configuration
        configuring: {
          invoke: {
            src: configMachine,
            autoForward: true,
            data: { product: ({ productId }) => productId },
            onDone: { target: "addingToBasket", actions: ["setConfig"] }
          }
        },

        // The product configuration is being processed
        addingToBasket: {
          entry: "clearError",
          invoke: {
            src: "add",
            onDone: {
              target: "complete",
              actions: ["setResponse"]
            },
            onError: { target: "#error", actions: ["setError"] }
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
          type: "final",
          data: ({ response }) => response
        }
      }
    },
    {
      actions: {
        setConfig: assign({
          config: (context, { data }) => data
        }),
        // ---
        setResponse: assign({
          response: (context, { data }) => useBasketParser(data)
        }),
        // ---
        setError: assign({
          error: (context, { data }) => data || "Unknown error"
        }),
        clearError: assign({ error: null })
      },
      services,
      guards: {},
      delays: {
        wait: () => useTime().MILLISECOND * 100 // this allows us to wait for an imperceptible amount of time before continuing
      }
    }
  );
