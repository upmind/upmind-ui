// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --- utils
import { useTime } from "../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./session.machine.typegen").Typegen0,
    id: "sessionManager",
    predictableActionArguments: true,
    initial: "checking",
    context: {
      token: null,
      basket: null,
      // ---
      error: null
    },
    states: {
      // our initial state will check 'self' and see if we have a token and a basket
      // if we do, we can skip generating a token and basket
      // TODO: add necessary cheand and states when we add user accounts with auth
      checking: {
        id: "checking",
        invoke: {
          src: "check",
          onDone: {
            target: "processed",
            actions: ["setToken", "setBasket"]
          },
          onError: {
            target: "generating",
            actions: ["setError"]
          }
        }
      },

      // otherwise we will generate a "guest" token and a new basket
      generating: {
        initial: "token",
        states: {
          token: {
            invoke: {
              src: "generateGuestToken",
              onDone: {
                target: "basket",
                actions: ["setToken"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          basket: {
            invoke: {
              src: "generateBasket",
              onDone: {
                target: "#processed", // dont thin kwe need to generate anything else
                actions: ["setBasket"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          }
        }
      },

      processing: {
        id: "processing"
        // TODO invoke a sub states/service to do something
      },

      // Use a state to indicate a successful process
      // We automatically move into a stale state  based on the token/local storage refresh time
      processed: {
        id: "processed",
        initial: "available",
        states: {
          available: {
            after: [
              {
                delay: 100000, // todo determine that from the token/local storage
                target: "stale"
              }
            ]
          },
          stale: {
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
        after: {
          wait: "#complete" // automatically move to complete after  max age
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
      setToken: assign({
        token: (context, { data }) => data
      }),

      setBasket: assign({
        basket: (context, { data }) => data
      }),

      reset: assign({
        token: null,
        basket: null
      }),

      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),
      clearError: assign({ error: null })
    },
    guards: {},

    delays: {
      wait: () => useTime().MINUTE // this allows us to wait for a reasonable amount of time before continuing
    },
    services
  }
);
