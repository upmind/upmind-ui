// TODO: make the basket transfer/dump on session change
//  on auth it should take the current  gues tbasket and transfer it to the new client
//  on unauth it should dump the current basket and wait for a new one to be created
//  also try get away from autogenerating the basket immediately...wait for a product or something
// might make the transfer/dumping of the basket easier

// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { raise } = actions;

// --- internal
import services from "./services";
import type { BasketContext } from "./types.d";
import { responseCodes } from "../api/types.d";
import productMachine from "./product.machine";
import itemsMachine from "./items.machine";
// --- utils
import { get, set, unset, isEmpty, uniqueId, forEach } from "lodash-es";

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
      basket: {},
      spawned: {},
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
          onError: { target: "error", actions: ["setError"] }
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
          onDone: {
            target: "#idle"
            // actions: ["setBasket"] // we dont need to set the basket again..do we?
          },
          onError: { target: "#error", actions: ["setError"] }
        }
      },

      // We can now generate a basket (only when we have something to put in it), and start listening for items being added/removed/updated
      idle: {
        id: "idle",
        type: "parallel",
        states: {
          client: {
            initial: "checking",
            states: {
              checking: {
                invoke: {
                  src: "isAuthenticated",
                  onDone: { target: "authenticated" },
                  onError: { target: "unauthenticated" }
                }
              },
              unauthenticated: {},
              authenticated: {
                type: "final"
              }
            },
            on: {
              AUTHENTICATED: { target: "#claiming" }
            }
          },
          items: {
            initial: "empty",
            states: {
              empty: {
                always: [{ target: "idle", cond: "hasItems" }]
              },
              idle: {
                invoke: {
                  id: "items",
                  src: itemsMachine,
                  data: {
                    basketId: context => context.basket.id,
                    items: context => context.basket.products
                  },
                  onError: { actions: ["setError"] }
                }
              },
              spawning: {
                always: [{ target: "empty", cond: "hasNoSpawned" }]
              },
              processed: {
                type: "final"
              }
            },
            on: {
              KILL: { actions: ["killSpawned"] },
              "PRODUCT.ADD": [
                { target: "#generating", cond: "hasNoBasket" },
                { target: "items.spawning", actions: ["addProduct"] }
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
          GENERATE: { target: "#generating" }
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

      clearing: {
        id: "clearing",
        invoke: {
          src: "dump",
          onDone: { target: "#loading", actions: ["clearBasket"] }
        }
      },

      // Handle errors
      error: {
        id: "error"
      },

      complete: {
        type: "final"
      }
    },
    on: {
      UNAUTHENTICATED: { target: "#clearing" }
    }
  },
  {
    actions: {
      setBasket: assign({
        basket: (context, { data }) => data
      }),

      clearBasket: assign({
        basket: {}
      }),

      // --- Product actions

      addProduct: assign({
        spawned: ({ spawned, basket }, { data }) => {
          // spawn an actor for the new request
          const name = uniqueId("product_");
          const machine = spawn(
            productMachine({ name, basketId: basket.id, product: data }),
            {
              name,
              sync: true
            }
          );

          // for now well just add the new machine to our list
          set(spawned, name, machine);
          return spawned;
        }
      }),

      killSpawned: assign({
        spawned: ({ spawned }, { data }) => {
          // try find any basket with the same name
          const machine = get(spawned, data.name);

          // if it exists, stop the referenced machine
          if (machine) machine.stop();

          // and remove it from our list of basket
          unset(spawned, data.name);

          return spawned;
        },
        basket: ({ basket }, { data }) => data.response
      }),

      killAllSpawned: assign({
        spawned: ({ spawned }) => {
          // try find any basket with the same name
          forEach(spawned, ({ machine, name }) => {
            machine.stop();
            // and remove it from our list of basket
            unset(spawned, name);
          });

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
