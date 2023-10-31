// TODO: make the basket transfer/dump on session change
//  on auth it should take the current  gues tbasket and transfer it to the new client
//  on unauth it should dump the current basket and wait for a new one to be created
//  also try get away from autogenerating the basket immediately...wait for a product or something
// might make the transfer/dumping of the basket easier

// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services, { SemanticTypes } from "./services";
import type { BasketContext } from "./types.d";
import configurationMachine from "../products/config.machine";
import { useBrand } from "../brand";
const { hasModuleEnabled } = useBrand();

// --- utils
import {
  every,
  find,
  findIndex,
  forEach,
  get,
  has,
  filter,
  isEmpty,
  reduce,
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
    name: values?.id || uniqueId("basket_item_"),
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
      bin: [],
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
          onDone: { target: "#shopping", actions: ["setBasket", "loadItems"] },
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
                always: [
                  { target: "configuring", cond: "hasItems" },
                  { target: "removing", cond: "hasBinnedItems" }
                ]
              },

              configuring: {
                always: [
                  { target: "empty", cond: "hasNoItems" },
                  { target: "adding", cond: "hasNewItems" },
                  { target: "updating", cond: "hasDirtyItems" },
                  { target: "removing", cond: "hasBinnedItems" },
                  { target: "configured", cond: "allConfigured" }
                ]
              },

              adding: {
                id: "adding",
                invoke: {
                  src: "addItem",
                  onDone: [
                    {
                      target: "configuring",
                      actions: [
                        "addSemanticItem",
                        "replaceItem",
                        "updateBasket"
                      ],
                      cond: "hasSemanticReplacement"
                    },
                    {
                      target: "configuring",
                      actions: ["replaceItem", "updateBasket"]
                    }
                  ]
                }
              },

              removing: {
                id: "removing",
                invoke: {
                  src: "removeItem",
                  onDone: {
                    target: "configuring",
                    actions: ["removeItem", "updateBasket"]
                  }
                }
              },

              updating: {
                id: "updating",
                invoke: {
                  src: "updateItem",
                  onDone: {
                    target: "configuring",
                    actions: ["refreshItem", "updateBasket"]
                  }
                }
              },

              configured: {
                always: [
                  { target: "empty", cond: "hasNoItems" },
                  { target: "adding", cond: "hasNewItems" },
                  { target: "updating", cond: "hasDirtyItems" },
                  { target: "removing", cond: "hasBinnedItems" }
                ],
                type: "final"
              }
            },
            on: {
              ADD: [
                {
                  target: "#generating",
                  cond: "hasNoBasket",
                  actions: ["addItem"]
                },
                { actions: ["addItem"] }
              ],
              REMOVE: { actions: ["binItem"] },
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
          UNAUTHENTICATED: { target: "#loading", actions: ["clearBasket"] }
        },
        onDone: {
          target: "checkout"
        }
      },

      // when we are ready for checkout, we can start the checkout process
      // and lock the basket from being modified
      //  TODO: merge this into shopping as additional parallel state
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

      updateBasket: assign({
        basket: (context, { data }) => {
          const value = get(data, "basket", context.basket);
          return useBasketParser(value);
        }
      }),

      clearBasket: assign({
        basket: {}
      }),

      // --- Configuring Items Actions

      loadItems: assign({
        items: ({ items, basket }, { data }) => {
          forEach(basket?.products, product => {
            // TODO: check if the item already exists
            // const item = find(items, ["id", product.id]);
            const machine = spawnConfiguration(product);
            items.push(machine);
          });
          return items;
        }
      }),

      addItem: assign({
        items: ({ items }, { data }) => {
          const machine = spawnConfiguration(data);
          items.push(machine);
          return items;
        }
      }),

      addSemanticItem: assign({
        items: ({ items }, { data }) => {
          if (!hasModuleEnabled("web_hosting")) return false;

          const { basket, itemId, newId } = data;
          const product = find(basket?.products, ["id", newId]);
          const item = find(items, ["id", itemId]);
          debugger;

          const replacements = filter(
            item.state?.context?.available?.provision_fields,
            ["semantic_type", SemanticTypes.DOMAIN_NAMES]
          );
          debugger;

          forEach(replacements, field => {
            console.log("Semantic replacement field", field);
            const value = get(item.state?.context, [
              "values",
              "provision_fields",
              field.name
            ]);

            // TODO: find a way to get the actual product that relats to this field
            const machine = spawnConfiguration({
              productId: "78985742-6489-7012-096c-21e325d0ed36",
              provision_fields: {
                [field.name]: value
              }
            });

            items.push(machine);
          });

          return items;
        }
      }),

      binItem: assign({
        bin: ({ items, bin }, { data }) => {
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(items, ["id", itemId]);
          if (removed) removed.forEach(item => bin.push(item)); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return bin;
        }
      }),

      removeItem: assign({
        items: ({ items }, { type, data }, other) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(items, ["id", itemId]);
          if (removed) removed.forEach(item => item.stop()); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return items;
        },
        bin: ({ bin }, { data }, other) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(bin, ["id", itemId]);
          if (removed) removed.forEach(item => item.stop()); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return bin;
        }
      }),

      refreshItem: assign({
        items: ({ items }, { data }, other) => {
          const itemId = data?.itemId;
          const index = findIndex(items, ["id", itemId]);
          const item = get(items, index);

          const newValues = find(data?.basket?.products, ["id", itemId]);

          if (item) item.send({ type: "REFRESH", data: newValues });

          // spawn the item(s) that are missing form the updated basket
          // changing quantity can result in, but we will be safe and handle multiple
          const newItems = reduce(
            data?.basket?.products,
            (result, product) => {
              const isNew = !some(items, ["id", product.id]);

              if (isNew) {
                const machine = spawnConfiguration(product);
                result.push(machine);
              }
              return result;
            },
            []
          );

          // now add any new item(s)  the items array,
          // at the same index so that we dont have any ui jank
          if (newItems.length) items.splice(index, 0, ...newItems);
          // if (newItems.length) items.push(...newItems);

          return items;
        }
      }),

      replaceItem: assign({
        items: ({ items }, { type, data }, other) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId;

          // find the item to be removed
          const index = findIndex(items, ["id", itemId]);
          const item = get(items, index);
          if (item) item.stop(); // ensure the machine is stopped

          // spawn any item(s) that are missing form the updated basket
          // this may occur when adding an item with more than 1 quantity
          const newItems = reduce(
            data?.basket?.products,
            (result, product) => {
              const isNew = !some(items, ["id", product.id]);

              if (isNew) {
                const machine = spawnConfiguration(product);
                result.push(machine);
              }
              return result;
            },
            []
          );

          // now put the item(s) back into the items array,
          // at the same index so that we dont have any ui jank
          if (newItems.length) items.splice(index, 1, ...newItems);

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
      hasItems: ({ items }) => !isEmpty(items),

      hasNoItems: ({ items }) => isEmpty(items),

      allConfigured: ({ items }) =>
        every(items, ({ state }) => state?.matches("configured")),

      // --- Item Guards
      hasNewItems: ({ items }) => {
        const value = some(items, ({ id, state }) => {
          const isConfigured = state.matches("configured");
          const isNew = get(state, "context.isNew");
          return isConfigured && isNew;
        });

        return value;
      },

      hasBinnedItems: ({ bin }) => !isEmpty(bin),

      hasDirtyItems: ({ items }) => {
        return some(items, ({ state }) => {
          const isConfigured = state.matches("configured");
          const isDirty = get(state, "context.isDirty");
          const isNew = get(state, "context.isNew");
          return isConfigured && !isNew && isDirty;
        });
      },

      hasSemanticReplacement: ({ items }, { data }) => {
        if (!hasModuleEnabled("web_hosting")) return false;

        const { itemId } = data;
        const item = find(items, ["id", itemId]);
        const replacements = filter(
          item.state?.context?.available?.provision_fields,
          ["semantic_type", SemanticTypes.DOMAIN_NAMES]
        );
        return !!replacements.length;
      },

      hasProducts: ({ basket }) => !!basket?.products?.length
    },

    delays: {},
    services
  }
);
