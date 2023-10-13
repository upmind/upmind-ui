// TODO: make the basket transfer/dump on session change
//  on auth it should take the current  gues tbasket and transfer it to the new client
//  on unauth it should dump the current basket and wait for a new one to be created
//  also try get away from autogenerating the basket immediately...wait for a product or something
// might make the transfer/dumping of the basket easier

// --- external
import { createMachine, assign, actions } from "xstate";

// --- internal
import services from "./services";
import type { BasketContext } from "./types.d";
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
      basket: {},
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
            // actions: ["setBasket"] // we dont need to set the basket again..do we?
          },
          onError: { target: "#error", actions: ["setError"] }
        }
      },

      // We are now ready to start accepting items into the basket
      // items are added to a queue and processed
      // this allows us to have multiple products added at once
      // once items in the queue are configured, we can then add them to the basket,
      // once successfully added, we can then remove them from the queue
      // and listen for update/remove events
      shopping: {
        id: "shopping",
        type: "parallel",
        states: {
          queue: {
            initial: "empty",
            states: {
              empty: {
                type: "final",
                on: {
                  ADD: [{ target: "processing" }]
                }
              },

              processing: {
                invoke: {
                  id: "queue",
                  src: itemsMachine,
                  autoForward: true,
                  data: {
                    basketId: ({ basket }) => basket?.id, // pass the basket Id, if we have one : this will auto generate a basket if we dont
                    items: (_context, { data }) => [data] // pass through the item being added
                  },
                  onDone: { target: "empty" }
                },
                on: {
                  REFRESH: { actions: ["setBasket"] }
                }
              }
            }
          },
          items: {
            initial: "empty",
            states: {
              empty: {
                always: [{ target: "processed", cond: "hasItems" }]
              },
              processing: {},
              processed: {
                type: "final"
              }
            }
            // on: {
            // "PRODUCT.UPDATE": {
            //   target: "processing",
            // cond: "hasItems"
            // },
            // "PRODUCT.REMOVE": {
            //   target: "processing",
            // cond: "hasItems"
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
          UNAUTHENTICATED: { target: "#clearing" }
        },
        onDone: {
          target: "checkout"
        }
      },

      // when we are ready for checkout, we can start the checkout process
      // and lock the basket from being modified
      checkout: {
        type: "parallel",
        states: {
          billing: {},
          shipping: {},
          payment: {},
          additional: {}
        },
        on: {
          UNAUTHENTICATED: { target: "#clearing" }
        },
        onDone: {
          target: "complete"
        }
      },

      // Dump the current basket...maybe confirm with the user?
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

      // ---

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    guards: {
      hasItems: ({ basket }) => !!basket?.products?.length
    },

    delays: {},
    services
  }
);
