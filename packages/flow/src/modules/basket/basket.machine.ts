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
import configurationMachine from "./productConfig.machine";

// --- utils
import {
  every,
  find,
  has,
  includes,
  isEmpty,
  remove,
  some,
  trimStart,
  uniqueId
} from "lodash-es";
import { useBasketParser } from "./utils";

// --------------------------------------------------------
// utility function to spawn machines based on the given items
function spawnConfiguration(values) {
  return spawn(configurationMachine(values), {
    name: uniqueId("basket_item_"),
    sync: true
  });
}

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./basket.machine.typegen").Typegen0,
    id: "basketManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      basket: null,
      items: [],
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
          onDone: { target: "#shopping", actions: ["setBasket"] },
          onError: { target: "error", actions: ["setError"] }
        }
      },

      // if we have a session, we can now claim any existing basket
      claiming: {
        id: "claiming",
        invoke: {
          src: "claim",
          onDone: {
            target: "#shopping"
          },
          onError: { target: "#error", actions: ["setError"] }
        }
      },

      // if we dont have a basket, we can now generate one
      generating: {
        id: "generating",
        invoke: {
          src: "generate",
          onDone: {
            target: "shopping",
            actions: ["setBasket"]
          },
          onError: { target: "#error" }
        }
      },

      // We are now ready to start accepting items into the basket
      // items are effectively products that are not yet added to the basket OR products that are being changed
      // regardles, these items require configuring
      // once items are configured, we can then add them (back) into the basket,
      // NB: this allows us to have multiple products added at once and have a mixed basket
      // once successfully added, they become products and can be updated/removed
      shopping: {
        id: "shopping",
        type: "parallel",
        states: {
          items: {
            initial: "empty",
            states: {
              empty: {
                always: [{ target: "configuring", cond: "needsConfiguring" }],
                type: "final"
              },
              configuring: {
                always: [{ target: "empty", cond: "allConfigured" }]
              }
            },
            on: {
              "UPDATE.QUANTITY": { actions: ["sendToItem"] },
              "UPDATE.TERM": { actions: ["sendToItem"] },
              "UPDATE.OPTIONS": { actions: ["sendToItem"] },
              "UPDATE.ATTRIBUTES": { actions: ["sendToItem"] },
              "UPDATE.PROVISIONING": { actions: ["sendToItem"] }

              // CONFIGURED: { actions: ["addProduct"] },

              // This transition will match any event, but we will target the completion of ANY spawned machine
              // "*": {
              //   actions: ["removeItem"],
              //   cond: (_context, event) => includes(event.type, "done.invoke")
              // }
            }
          },
          products: {
            initial: "empty",
            states: {
              empty: {
                always: [
                  { target: "adding", cond: "hasNewItems" },
                  // { target: "updating", cond: "hasChangedItems" },
                  { target: "added", cond: "hasProducts" }
                ]
              },
              adding: {
                id: "adding",
                invoke: {
                  src: "addToBasket",
                  onDone: {
                    target: "empty",
                    actions: ["removeItem", "setResponse"]
                  }
                }
              },
              // updating: {
              //   id: "updating",
              //   invoke: {
              //     src: "update",
              //     onDone: {
              //       target: "empty",
              //       actions: ["remove", "setResponse"]
              //     }
              //   }
              // },
              added: {
                always: [{ target: "adding", cond: "hasNewItems" }],
                type: "final"
              }
            }
            // on: {
            // "PRODUCT.UPDATE": {
            //   target: "processing",
            // cond: "needsConfiguring"
            // },
            // "PRODUCT.REMOVE": {
            //   target: "processing",
            // cond: "needsConfiguring"
            // }
            // }
          },
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
          }
        },
        on: {
          UNAUTHENTICATED: { target: "#loading", actions: ["clearBasket"] },
          ADD: [
            {
              target: "#generating",
              cond: "hasNoBasket",
              actions: ["addItem"]
            },
            { target: "shopping", actions: ["addItem"] }
          ]
        },
        onDone: {
          target: "checkout"
        }
      },

      // when we are ready for checkout, we can start the checkout process
      // and lock the basket from being modified
      //  todo merge this into shopping as additional parallel state
      checkout: {
        type: "parallel",
        states: {
          billing: {},
          shipping: {},
          payment: {},
          additional: {}
        },
        on: {
          UNAUTHENTICATED: { target: "#loading", actions: ["clearBasket"] }
        },
        onDone: {
          target: "complete"
        }
      },

      // Handle errors
      error: {
        id: "error"
      },

      complete: {
        type: "final"
      }
    }
  },
  {
    actions: {
      setBasket: assign({
        basket: (context, { data }) => data
      }),

      setResponse: assign({
        basket: (context, { data }) => {
          data?.basket || context.basket;
        }
      }),

      clearBasket: assign({
        basket: {}
      }),

      // --- Configuring Items Actions

      addItem: assign({
        items: ({ items }, { data }) => {
          const machine = spawnConfiguration(data);
          items.push(machine);
          return items;
        }
      }),

      removeItem: assign({
        items: ({ items }, { type, data }, other) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId || trimStart(type, "invoke.done.");

          // try find any items with the same hash
          const item = find(items, ["id", itemId]);

          // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          if (item) item.stop();

          // finally remove it from our items
          remove(items, ["id", itemId]);
          return items;
        }
      }),

      // ---
      sendToItem: sendTo(
        (_context, { data: { itemId } }) => itemId,
        (_context, { type, data }) => ({ type, data })
      ),

      // ---

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    guards: {
      hasNoBasket: ({ basket }) => isEmpty(basket),

      // --- Configuration Guards
      needsConfiguring: ({ items }) => !isEmpty(items),

      allConfigured: ({ items }) => isEmpty(items), // ||  every(items, ({ state }) => state?.matches("configured")),

      // --- Item Guards
      hasNewItems: ({ items }) => {
        return some(
          items,
          ({ state }) =>
            state.matches("configured") && !has(state, "context.config.id")
        );
      },

      hasChangedItems: ({ items }) => {
        return some(
          items,
          ({ state }) =>
            state.matches("configured") && has(state, "context.config.id")
        );
      },

      hasProducts: ({ basket }) => !!basket?.products?.length
    },

    delays: {},
    services
  }
);
