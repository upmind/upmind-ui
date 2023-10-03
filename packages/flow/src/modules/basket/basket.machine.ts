// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { BasketContext } from "./types";
import { responseCodes } from "../api/types.d";

// --- utils
import { useBasketParser } from "./utils";
import { useTime } from "../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./basket.machine.typegen").Typegen0,
    id: "basketManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      debug: false,
      // ---
      basket: {},
      // ---
      error: null
    } as BasketContext,
    states: {
      // our initial state will check 'self' and see if we have a basket
      // if we do, we can skip generating a basket
      // TODO: add necessary cheand and states when we add user accounts with auth
      loading: {
        id: "loading",
        invoke: {
          src: "check",
          onDone: [
            { target: "#processed.empty", cond: "hasNoContent" },
            { target: "#processed", actions: ["setBasket"] }
          ],
          onError: [
            {
              target: "error.unauthorized",
              actions: ["setError"],
              cond: "isUnauthorized"
            },

            { target: "error", actions: ["setError"] }
          ]
        }
      },

      // otherwise we will generate an "empty" basket

      processing: {
        id: "processing",
        initial: "generating",
        states: {
          generating: {
            id: "generating",
            invoke: {
              src: "create",
              onDone: { target: "#processed", actions: ["setBasket"] },
              onError: { target: "#error" }
            }
          }
        }

        // TODO invoke a sub states/service to do something
      },

      // Use a state to indicate a successful process
      // We automatically move into a stale state  based on the basket/local storage refresh time
      processed: {
        id: "processed",
        initial: "available",
        states: {
          available: {},
          empty: {
            // temporarily autocreate basket
            always: {
              target: "#processing"
            }
            // on: {
            //   CREATE: { target: "#processing", actions: ["clearError"] }
            // }
          }
        }
      },

      // Handle errors
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
            entry: ["clearError"],
            invoke: {
              src: "refreshToken",
              onDone: { target: "#loading" },
              onError: { target: "#error" }
            }
          }
        },

        on: {
          RETRY: { target: "loading", actions: ["clearError"] },
          CANCEL: { target: "complete" }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        entry: ["resetBasket"],
        type: "final"
      }
    }
  },
  {
    actions: {
      setBasket: assign({
        basket: (context, { data }) => useBasketParser(data)
      }),

      resetBasket: assign({
        basket: {}
      }),

      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    guards: {
      isUnauthorized: (_context, { data }) =>
        data?.status === responseCodes.Unauthorized,

      hasNoContent: (_context, { data }) =>
        data?.status === responseCodes.No_Content
    },

    delays: {
      wait: () => useTime().MINUTE // this allows us to wait for a reasonable amount of time before continuing
    },
    services
  }
);
