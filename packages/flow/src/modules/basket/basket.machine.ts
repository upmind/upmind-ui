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
import configurationMachine from "../products/config.machine";
import { useBrand } from "../brand";
const { hasModuleEnabled } = useBrand();

// --- utils
import { useTime } from "../../utils";
import {
  differenceBy,
  every,
  find,
  findIndex,
  forEach,
  get,
  has,
  first,
  filter,
  isEmpty,
  reduce,
  remove,
  some,
  trimStart,
  uniqueId,
  difference
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
                  { target: "configuring", cond: "someConfiguring" },
                  { target: "configured", cond: "allConfigured" }
                ]
              },

              configuring: {
                id: "configuring",
                always: [
                  { target: "empty", cond: "hasNoItems" },
                  { target: "configured", cond: "allConfigured" }
                ]
              },

              processing: {
                initial: "everything",
                states: {
                  everything: {
                    invoke: {
                      src: "update",
                      onDone: {
                        target: "#configuring",
                        actions: ["refreshItems", "updateBasket"]
                      },
                      onError: {
                        target: "error",
                        actions: ["setError"]
                      }
                    }
                  },

                  updating: {
                    id: "updating",
                    invoke: {
                      src: "updateItem",
                      onDone: [
                        {
                          target: "queue",
                          actions: ["refreshItems", "updateBasket"],
                          cond: (_context, { data }) => !!data?.queue
                        },
                        {
                          target: "#configuring",
                          actions: ["refreshItems", "updateBasket"]
                        }
                      ],

                      onError: {
                        target: "error",
                        actions: ["setError"]
                      }
                    }
                  },

                  removing: {
                    id: "removing",
                    invoke: {
                      src: "removeItem",
                      onDone: [
                        {
                          target: "queue",
                          actions: ["removeItem", "updateBasket"],
                          cond: (_context, { data }) => !!data?.queue
                        },
                        {
                          target: "#configuring",
                          actions: ["removeItem", "updateBasket"]
                        }
                      ],
                      onError: {
                        target: "error",
                        actions: ["setError"]
                      }
                    }
                  },

                  queue: {
                    always: [
                      { target: "updating", cond: "hasNewItems" },
                      { target: "updating", cond: "hasDirtyItems" },
                      { target: "removing", cond: "hasBinnedItems" },
                      { target: "#configuring" }
                    ]
                  },

                  error: {
                    after: {
                      error: "#configuring"
                    }
                  }
                }
              },

              // items are 'configured' only when they have been successfully added to the basket
              configured: {
                id: "configured",
                always: [
                  { target: "empty", cond: "hasNoItems" },
                  { target: "configuring", cond: "someConfiguring" }
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
              REMOVE: {
                target: "items.processing.removing",
                actions: ["binItem"]
              },
              UPDATE: [
                {
                  target: ["items.processing.updating"],
                  cond: (_context, { data }) => !!data?.itemId
                },
                { target: ["items.processing"] } // queue process ALL items
              ],
              CLEAR: {
                target: "items.processing",
                actions: ["binAllItems"]
              }, // bath process ALL items
              // ---
              "UPDATE.QUANTITY": { actions: ["sendToItem"] },
              "UPDATE.TERM": { actions: ["sendToItem"] },
              "UPDATE.OPTIONS": { actions: ["sendToItem"] },
              "UPDATE.ATTRIBUTES": { actions: ["sendToItem"] },
              "UPDATE.PROVISIONING": { actions: ["sendToItem"] }

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
          const products = data?.products || basket?.products || [];
          forEach(products, product => {
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

      addAncillaryItems: assign({
        items: ({ items }, { data }) => {
          // if (!hasModuleEnabled("web_hosting")) return false;

          // const { basket, itemId, newId } = data;
          // const product = find(basket?.products, ["id", newId]);
          // const item = find(items, ["id", itemId]);

          // const replacements = filter(
          //   item.state?.context?.available?.provision_fields,
          //   ["semantic_type", SemanticTypes.DOMAIN_NAMES]
          // );

          // forEach(replacements, field => {
          //   console.log("Semantic replacement field", field);
          //   const value = get(item.state?.context, [
          //     "values",
          //     "provision_fields",
          //     field.name
          //   ]);

          //   // TODO: find a way to get the actual product that relats to this field
          //   const machine = spawnConfiguration({
          //     productId: "78985742-6489-7012-096c-21e325d0ed36",
          //     provision_fields: {
          //       [field.name]: value
          //     }
          //   });

          //   items.push(machine);
          // });

          // TODO:
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
      binAllItems: assign({
        bin: ({ items, bin }, { data }) => {
          return items;
        },
        items: ({ items, bin }, { data }) => {
          return [];
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
          const itemId = first(data?.items)?.id;
          const index = findIndex(items, ["id", itemId]);
          const item = get(items, index);

          const newValues = find(data?.basket?.products, ["id", itemId]);

          if (item) item.send({ type: "REFRESH", data: newValues });

          // spawn the item(s) that are missing form the updated basket
          // changing quantity can result in, but we will be safe and handle multiple
          // const newItems = reduce(
          //   data?.basket?.products,
          //   (result, product) => {
          //     const isNew = !some(items, ["id", product.id]);

          //     if (isNew) {
          //       const machine = spawnConfiguration(product);
          //       result.push(machine);
          //     }
          //     return result;
          //   },
          //   []
          // );

          // now add any new item(s)  the items array,
          // at the same index so that we dont have any ui jank
          // if (newItems.length) items.splice(index, 0, ...newItems);
          // if (newItems.length) items.push(...newItems);

          return items;
        }
      }),

      refreshItems: assign({
        items: ({ items }, { type, data }, other) => {
          forEach(data?.items, (item, index) => {
            const itemId = item.id;
            const product = find(data?.basket?.products, ["id", itemId]);
            const isReplaced = !product;
            // Check if the item still exists in the basket
            // if not, we need to replace it with a new machine
            // and stop the old one
            // NB: its safe to assume that the items array is in the same order as the newItems
            // so we can use the index to match the items
            if (isReplaced) {
              const newId = get(data?.newItems, [index, "id"]);
              const currentIndex = findIndex(items, ["id", itemId]);
              if (item) item.stop(); // ensure the machine is stopped
              const product = find(data?.basket?.products, ["id", newId]);
              if (product) {
                const machine = spawnConfiguration(product);
                // now put the item(s) back into the items array,
                // at the same index so that we dont have any ui jank
                items.splice(currentIndex, 1, machine);
              } else {
                console.warn(
                  "Replacing old item",
                  itemId,
                  "with new item",
                  newId,
                  "resulted in NO PRODUCT CONFIG being found"
                );
                items.splice(currentIndex, 1);
              }
            } else {
              const product = find(data?.basket?.products, ["id", itemId]);
              item.send({ type: "REFRESH", data: product });
            }
          });

          // ---
          // NB: do some housekeeping and ensure that we dont have any missing items
          const missing = differenceBy(data?.basket?.products, items, "id");
          forEach(missing, product => {
            const machine = spawnConfiguration(product);
            items.push(machine);
          });

          // TODO: MAYBE we should stop any machines that are no longer in the basket
          // but that would prob impact and items that are still being configured
          // const dangling = differenceBy(items, data?.basket?.products, "id");
          // forEach(dangling, (item, currentIndex) => {
          //   item.stop();
          //   items.splice(currentIndex, 1);
          // });

          // ---
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
        error: (context, { data }) => data.error || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    guards: {
      hasNoBasket: ({ basket }) => isEmpty(basket),

      // --- Configuration Guards
      hasItems: ({ items }) => !isEmpty(items),

      hasNoItems: ({ items }) => isEmpty(items),

      allConfigured: ({ items, bin }) => {
        const allConfigured = every(
          items,
          ({ state }) =>
            state?.matches("configured") &&
            state.context.isDirty !== true &&
            state.context.isNew !== true
        );
        return items?.length && allConfigured; //&& !bin?.length;
      },
      someConfiguring: ({ items }) =>
        some(
          items,
          ({ state }) =>
            state?.matches("configuring") ||
            state.context.isDirty === true ||
            state.context.isNew === true
        ),

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

      hasAncillaryItems: ({ items }, { data }) => {
        // if (!hasModuleEnabled("web_hosting")) return false;

        // const { itemId } = data;
        // const item = find(items, ["id", itemId]);
        // const replacements = filter(
        //   item.state?.context?.available?.provision_fields,
        //   ["semantic_type", SemanticTypes.DOMAIN_NAMES]
        // );
        // return !!replacements.length;
        return false;
      },

      hasProducts: ({ basket }) => !!basket?.products?.length
    },

    delays: {
      error: () => useTime().SECOND * 3, // this allows us to read the error before continuing
      wait: () => useTime().MILLISECOND * 100 // this allows us to wait for a imperceptible amount of time before continuing
    },
    services
  }
);
