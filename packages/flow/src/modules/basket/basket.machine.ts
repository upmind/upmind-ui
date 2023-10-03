// --- external
import { createMachine, assign, sendTo, spawn } from "xstate";

// --- internal
import services from "./services";
import type { BasketContext } from "./types";
import { responseCodes } from "../api/types.d";
import productMachine from "./product.machine";

// --- utils
import { useBasketParser } from "./utils";
import { useTime } from "../../utils";
import { remove, find, get, set, unset, isEmpty, uniqueId } from "lodash-es";

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
      spawned: {},
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
          },
          updating: {
            id: "updating",
            invoke: {
              src: "update",
              onDone: { target: "#processed", actions: ["setBasket"] },
              onError: { target: "#error" }
            }
          },
          spawning: {
            always: [{ target: "#processed", cond: "hasNoSpawned" }],
            on: {
              KILL: {
                actions: ["setBasket", "killSpawn"]
              },

              "PRODUCT.ADD": {
                target: "#processing.spawning",
                actions: ["addProduct"]
                // cond: "canAddProduct"
              }

              // KILL_ALL: {
              //   actions: "killAllSpawn"
              // }
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
        },
        on: {
          "PRODUCT.ADD": {
            target: "#processing.spawning",
            actions: ["addProduct"]
            // cond: "canAddProduct"
          }
          // "PRODUCT.UPDATE": {
          //   target: "#processing.updating",
          //   actions: ["updateProduct"]
          //   // cond: "canUpdateProduct"
          // },
          // "PRODUCT.REMOVE": {
          //   target: "#processing.updating",
          //   actions: ["removeProduct"]
          //   // cond: "canRemoveProduct"
          // }
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

      // Handle completion, stop the machine and prevent further basket
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

      // --- Product actions

      addProduct: assign({
        spawned: ({ spawned, basket }, { data }) => {
          // spawn an actor for the new request
          const uuid = uniqueId("product_");
          const machine = spawn(productMachine, {
            name: uuid,
            sync: true
          });

          // for now well just add the new machine to our list
          set(spawned, uuid, machine);

          // and then forward the request to the new machine to process
          machine.send({
            type: "ADD",
            data: { id: uuid, basket_id: basket.id, product: data }
          });

          return spawned;
        }
      }),

      killSpawn: assign({
        spawned: ({ spawned }, { data: { id } }) => {
          // try find any basket with the same hash
          const machine = get(spawned, id);

          // if it exists, stop the referenced machine
          // and remove it from our list of basket
          if (machine) {
            machine.stop();
            unset(spawned, id);
          }

          return spawned;
        }
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
        data?.status === responseCodes.No_Content,

      hasNoSpawned: ({ spawned }) => isEmpty(spawned)
    },

    delays: {
      wait: () => useTime().MINUTE // this allows us to wait for a reasonable amount of time before continuing
    },
    services
  }
);
