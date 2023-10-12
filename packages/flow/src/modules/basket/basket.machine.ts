// TODO: make the basket transfer/dump on session change
//  on auth it should take the current  gues tbasket and transfer it to the new client
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
    initial: "subscribing",
    context: {
      debug: false,
      // ---
      items: {},
      basket: {},
      // ---
      error: null
    } as BasketContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        invoke: {
          id: "authCallback",
          src: "authSubscription"
        },
        on: {
          SESSION: { target: "#loading" }
        }
      },
      // our initial state will check and see if we have an existing basket
      // if not, we dont generating a basket as this will inundate the backend with empty baskets
      // instead we will wait for an Action before we generate a basket
      loading: {
        id: "loading",
        invoke: {
          src: "check",
          onDone: { target: "#idle", actions: ["setBasket"] },
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
      generating: {
        id: "generating",
        invoke: {
          src: "create",
          onDone: { target: "#idle", actions: ["setBasket"] },
          onError: { target: "#error" }
        }
      },

      // if we have a session, we can now claim any existing basket
      claiming: {
        id: "claiming",
        invoke: {
          src: "claim",
          onDone: { target: "#idle", actions: ["setBasket"] },
          onError: { target: "#error", actions: ["setError"] }
        }
      },

      // We can now generate a basket (only when we have something to put in it), and start listening for items being added/removed/updated
      idle: {
        id: "idle",
        type: "parallel",
        states: {
          client: {
            initial: "unauthenticated",
            states: {
              unauthenticated: {},
              authenticated: {
                type: "final"
              }
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
              "PRODUCT.ADD": [
                { target: "#generating", cond: "hasNoBasket" },
                { actions: ["addProduct"] }
              ]
              // "PRODUCT.UPDATE": {
              //   target: "updating",
              //   actions: ["updateProduct"]
              //   // cond: "canUpdateProduct"
              // },
              // "PRODUCT.REMOVE": {
              //   target: "updating",
              //   actions: ["removeProduct"]
              //   // cond: "canRemoveProduct"
              // }
            }
          }
        },
        onDone: {
          target: "readyForCheckout"
        },
        on: {
          GENERATE: { target: "#generating" },
          AUTHENTICATED: { target: "#claiming" },
          UNAUTHENTICATED: { target: "#idle", actions: ["resetBasket"] }
        }
      },

      // when we are ready for checkout, we can start the checkout process
      // and lock the basket from being modified
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

      complete: {
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
          debugger;
          const machine = spawn(
            productMachine({ id: uuid, basketId: basket.id, product: data }),
            {
              name: uuid,
              sync: true
            }
          );
          debugger;
          // for now well just add the new machine to our list
          set(spawned, uuid, machine);
          debugger;

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

      hasNoBasket: ({ basket }) => isEmpty(basket),

      hasItems: ({ basket }) => !!basket?.products?.length
    },

    delays: {},
    services
  }
);
