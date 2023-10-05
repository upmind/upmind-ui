// TODO: make the basket transfer/dump on session change
//  on auth it should take the current  gues tbasket and transfer it to the new user
//  on unauth it should dump the current basket and wait for a new one to be created
//  also try get away from autogenerating the basket immediately...wait for a product or something
// might make the transfer/dumping of the basket easier

// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import type { BasketContext } from "./types.d";
import { responseCodes } from "../api/types.d";
import productMachine from "./product.machine";

// --- utils
import { useBasketParser } from "./utils";
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
      items: {},
      basket: {},
      // ---
      error: null
    } as BasketContext,
    states: {
      // our initial state will check 'self' and see if we have a basket
      // if we do, we can skip generating a basket
      // but if its empty..then autogenerate a new basket, maybe we dont want to do this until we add a product
      loading: {
        id: "loading",
        invoke: {
          src: "check",
          onDone: [
            { target: "#processing", cond: "hasNoContent" },
            { target: "#idle", actions: ["setBasket"] }
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

      // Use a transient state to indicate a successful process
      // We have an imperceptible delay to allow the components to understand the process is complete
      processed: {
        id: "processed",
        after: { wait: "idle" }
      },

      // we are idle when we have a basket
      idle: {
        id: "idle",
        type: "parallel",
        states: {
          // Subscribe to changes in auth and listen for a valid Authenticated user
          user: {
            initial: "subscribing",
            states: {
              subscribing: {
                invoke: {
                  id: "authCallback",
                  src: "authSubscription"
                }
              },
              invalid: {},
              valid: {
                type: "final"
              }
            },
            on: {
              AUTHENTICATED: { target: "user.valid" },
              UNAUTHENTICATED: { target: "user.invalid" }
            }
          },

          items: {
            initial: "empty",
            states: {
              empty: {
                always: { target: "valid", cond: "hasItems" }
              },
              valid: {
                type: "final"
              },
              invalid: {}
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
          }
        },
        onDone: {
          target: "readyForCheckout"
        }
      },

      readyForCheckout: {},

      checkout: {
        type: "parallel",
        states: {
          billing: {},
          shipping: {},
          payment: {},
          additional: {}
        },
        onDone: {
          target: "complete"
        }
      },

      // Handle errors
      // Handle errors
      error: {
        id: "error",
        initial: "unknown",
        states: {
          unknown: {},
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
          debugger;
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

      hasNoSpawned: ({ spawned }) => isEmpty(spawned),

      hasItems: ({ basket }) => !!basket?.products?.length
    },

    delays: {},
    services
  }
);
