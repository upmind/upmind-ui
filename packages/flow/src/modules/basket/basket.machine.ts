// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import services from "./services";
import type { BasketContext } from "./types.d";
import configurationMachine from "../product/product.machine";

// --- utils
import { useTime } from "../../utils";
import {
  useBasketParser,
  useSummaryParser,
  useValidationParser
} from "./utils";

import {
  differenceBy,
  every,
  find,
  findIndex,
  forEach,
  get,
  isEmpty,
  remove,
  some,
  trimStart,
  uniqueId
} from "lodash-es";

// --------------------------------------------------------
// utility function to spawn machines based on the given items
function spawnConfiguration(values, currency_id, promotions = []) {
  return spawn(configurationMachine(values, currency_id, promotions), {
    name: values?.id || uniqueId("basket_item_"),
    sync: true
  });
}

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCMCGsDWYAuBZVAdqjAE4B0sArsrAMYkCWyDBUAxAMoCiHHAkgHkAcgG0ADAF1EoAA4B7WA2wM5BaSAAeiAEwB2XQGYyATgMGxYgGwBGAKy6ALGIO6ANCACeic9qPGxABxi1rrWDuZixpYAvtHuaJg4+ESkZAA2cqgQLOwQqmBkLABuclhkCVh4hMRg5BlZOQjFcrSoyqriEp3q8ortakiaiLba7l4IBtYG2mTONsbaDgFRAXax8eiVyTV1mdmsbLUkcuQyaW0AZicAtuWbSdWp9ftQTQQlrf2d3YO9SioDUBaCZTBwmIJRFy2Bz2fRjHTGfxkSwjMJmawWALrEAVB4pWpkWjnBjXHJsPIEArNMq4qr48hE1AkxrNT4A76SHoKf6qdTAxYOMGWSzaazGAIGEXhMLwhDaSwBMgBXSRYy2AKWMy2WwGWzY2nbVKM5kHI4nMhnS43O6JOk7QnE0msN4fNrsyQ-WTc-p8nS6cVkPQ6jEhUJ2WW+CWzCWC+xS9W6fX3O2pGCUkhug4UqnvUoFA2PAlp2qZ16st0dD2c37egG+hAjWWrMjTbQLTULXTzAxJ22GotgdOlw4kY6nc7YK4kW4F+lkYsZ5TO8tfKtSGt9OuDfkBeyB4UGDVTbTaWzGWXWAJg8K2ZyIqx6BxhXtbQvkWAACzkMhkZOzFGwNp82Tft3y-H8ck9EA-h9bcdBhIURTFCUpUmBwIxFWwyAxK9tACPQpmMQwXzxe1P2-X8DgAVSEABBKiABUAAkuCEBi+AAYVohiuAAESgmCtyBeDoWRJDxUlRY0IjXddDIEYDFMJ8dXlPU4hxEC3wocDKKgQpsDAa5YDYWjeP46svU3Xk4LlQVENFCTUJlTxEBCIwz01MRbDsFFlWMEiUwJciINYfTDOM0z+OsddLJ5QEhgQaw7D8XRfEMVsDCfAIL2sU9ZlS+VRVPZxrBidTZzInScjCoy2AAJS4XABAANS4ATa2s4TEoWCMpjk1L-TbQxHBRHtys0udgt0mrjKogAFXjuLaizoI6+LgTFUYXMSyxwnksVxTVfCwlMALQO0ijqqUcK2HmxaeJEaKuSs9bXJ67aTzMWYxEKsQ7N8bQzq0qaroM2qOIAGS4Wi6val7602iM8JmfDVmhJx5X0IHJqq0Lrtqu6lrIABFKjaLYvgGIATThuKEbsLCVUcaYr3FJ9LAvH7jDIf1dHsMJL3lBxscqy68bB2aFqJni6twWnYK6pLHBbPRtFVHVFOCWUlPkk8AiCMMHCiMqNj7YHcb0-HJfurgyAEOb2OEDh5aEhKkpsFtdqiVUg0yjDUv2pZVlKtU1RF1IQfFm7CZ4shuIYuq+AAIUYngXc6t2wkVXCxUUyY+ZhCNYUDJwxT+kV8OI8azZxsXLYl26pdjua6pavh+GEPghAAcXT17ErCMQTG89VVbRfCIyWawTBRI2iNsSwrHDoKLZmshDJkbAPDYPuEacOTVklTUrwcNXsu20rJmRPDc7++VLC7ZewLrteN63neno3OmbKG2YUTEf08xdzGHCBePC3NhREV0MdEq6on4XRCvXcKhJVAXAYFASgjADi7xsoPA+UwDwnzPheEYWFDpEVzoVMaptXy10QWvWgqD0GYLJI9GKq14a4OWFhJ8XZDyhBcGqCMACUa6lyl5TKmUl7V1oaLehVsLTHFoHARQoUwBFFqB4bAH4-z5EKLmGkE05HTQUTIJRKjqrqM0dolkuY2SVi6CtQSGcNr7yVAQ4+gpiEX39FhFC0D-CLy8sqeBkckFGUUS0CxaiNEkC0To00o5zSWknNaCqEdV6mPMbAVRekrFxJscuOxFYCAcnYc4-uGJTCBkjPhGwu5UYXiIkYUuSVMoKkiAqUJmSJaROUTk6qlAZAQGHP+akwEa7GNBsgsxUSBmhSGSMpcZZimrkceUta9YzzXifLskBikojoR8ZqEw0w+YohsC4Z8MjSIZJflkuZuSyCLNGXo8ZNpZF3Pkb02Z-SnkvOWS6FoJTvif1igrN2bjD6EK8YEC8D9LAmCWB5BegjAY3MCs-b5Mzsn-OGcOM044rTTg+bcle9yfm4sGfiwFK53TrOet-RWkQjCfX1vKS8o9z7jEvM2XKfDJT+B+vYbpFKcWPOqiQQycgii6MpPokohjJlfJMZSiVoUpXXBlbY10aycFdTPDMCw-9oRhF2hzD6d8eb2EmCA7yhF0U0LJVi1V4q-mSulbKrMbyDETM+eS7FETfnRL0pq7VRTdX0rYYyiFriAHuKPoeWF3K3oe2hPrTsCYH6isDbAPpIayBhq9ewQlFoJxThnEYlV0yg1Uo1Z6nVwK9VOM2bgllNTDx1M5Y0y1KJkSODPNMBwNgukYvOmEtewb5l6QAI6UDAPOneLbOEGoWN9E1uzzUXnZUqNWOpUrmHRDm11tb1WzvnYu6NX9Y3DDXca28prh3DqaXhbCTgQEAO8jCEYx6a15qnU8udC6wA720BsldCVDXrofZu59H1SrT12tqJKIDHBWETGO82YrT3utCkBy9BhwNMshSEBNMLT5wstUEMg4QVS7lPLeMwGGnWYoQSe-9da8lJJIGwDQsBAIGTIKgC4BkSAAApCUAEo2DpIDex-N0717cf1ZC+N0LPEUZTd1MIPNFgLyIm2YIV5f1RwiYwggaCMFSogEuojN6JjxqsLeQByFtkGAvFCtsypnNmpASZ8JebzOWcwZAD+dnXYbW4TRkIx8BG+OEXoQOoQVTHlKibDSyq5PVVmVq-oEUzJkBbgIJqjtRDLuIxtPQsoB3RYM8sFwP0QmYbodNHLcg8v1Uai1W2RWSuCDK+FlxrkqvbQXkPZUeEVSKW8ra-zkTcsAjzW-beKngQgMVG0hwqUjbQK224Ub+sanKjDCqWM6XZMuuy8cBbqg81ZBeOSH1iq-XOrY1duQN2CB3YgC8IF9jSlrhjRF4YyweaZUFGqd9D9bBNh+iXD9LLMoMbm21vLQmftklLSkitpLWMTtR4t9Hv26UONWyD7mhg7KQ86XzarkQTB8wWElbUuph0o+u+1wnRa5U5me7j8dq8Ce3cLQ2iNTao3lfs+qCn4OjbQhpzD0beVT6BI5ZlWE7OPuc+F9zxJY4y3EsrZly7oUhdfZF1q4tf2QWA+vcDhsoPKcQ-l1EWn20bD9WFafRSdg8JYma1M03HO0eoFoMoDRtmgdDYQOt7CoJttESvHCUbp8TCBC26eJYhgfpzaJAwQc2ATKMRYhTLiPFzKDf7gKeyyFJLSiOeMRYpHLCmFCCrtv52q1ZdCnngvhIPxgFoBgHnCq8z86w-Q3vBBsD98H8PsX-2ylR-7rqLCbZT67TVvyxE7mPq7iwh2fw6aXD31z2kfP0-Z9D8x9xg3qSSUXbez38-ffaAD+vwvm3DK7fR9X4GEBQsW+egO+EYxgdgLYXYSUXMiw8Cb+c+cglAhe-4-GQE4+c4cBQ+CB2AZOcoBcNGwofCKED6RcAcywMIyoGaUosB7+GAWBt0dExerE7EZefEOBQY14BBx8koxBH0o0swxsLeGIDksQ6kBAcgEAcA6gF2y+9YAAtCELKLIYihYCoaoSoQdKEtQHQIwMwKwDIT-HZGJA5ChFJM5OMBEEPMKNvreMKEbMLAHk8HsDkPoV1G2MKDRkRP4L4GqH9GYQiIdiKK3g0rqGYLAY6M4T-lXpqGCLCCMA-L4LqLuBGIeNPFYH9HzLlCeBrg4QOEOMsi4QlJjEPNqE+IeA-E+PKCQhAsqLtDeOqDYHoP5gUcCJMLKLqEPNApMH9AsPRmpCxgLthvAJEXvA3sNnDu0mqHhPnIiHNgosts0W9FtDyt5IqNqBXAqHPMsJ3sbk-gFighZswlglAAsYlHzEYOkYiBKJlMdsIiKGJP4GIvrAqMxhlv6ibnsQBhEeCvbk+BApeHtr5CMIKCQmeLMDCAsEjm4VjDke8ZOpxuvLEvEl8RwhVogP4IqHtqYEENqKiFpiEN5MiH5B2MOoev5DCbsXCWes8jSsiRUvWH5NGGYF5DqMApqPCsOp7NwltnYFMMZuSROg8rhqGqLsccMTZAyYEEySzqybvo3gAgfKEAeD7lPPYf0RPvJp8XhhemACccOnJPUgCeqECaMd1K+pELySiDycfLMWqkKUpmOCcblFGOYEeJlGKDCKeE0lMC2AsMEGeGEL4M4DacgkFocZACcaKLeLptcQ+oKgvMInuHRqYGAXhEsLqJrp9kMd8dHv6LKOEBtmkZMNME6aEBmdrubvMWKV1AbLMKiDCJMFvtqLKNCFhPYBvl5MNPoNYGWSHhjnoVWQlJJDzKfIsJCA-JfCaQVNhKlIiFMMagqI6q8a9vjsHlziKScZlBAmqGYNDmEBjM2S4NfJckGMdtcmqS1u9pmfaScCcTWV5KKPWeIgzLKOai2BvhqKOczi8Y-iuVriHmHgwBoo6aCP-peD9KVP6Cys2cqD6YYByo1hKGfhftgCcbmR9HzP1NwqEDUZKKVEha-jQbSa2orCNo3leFhElN4alOmtAn0UuXjqvFPjPpQEQIgQPtPgwJ8OGQOcCGNkqOOYYNCJAtMKATpn9KvrtPoA0fhZfqgGxQXpxUBBACcXxRqMlqzsJUsToLuOcYvLEWKOqBqNQfAYgRGdqJYWYFtoEOlPoIro3sOoqIIksDeEjtQvRedBgbQYgeUAwGkOfv2dmVEblMOUENZeZX7LwTpptD5BiC4NccZZgd5Z+AwIghGYvKyuKMlJMEIf7DMAuRYIsHzCMOKAlV5TPjIKgB4NcAXmlXDp0Q0kzC6SaQxozD9OYM0rnERKVVgUTnFKgGkGZQGJqJlHRjZW7o3oYNPCEP8frFttMHRY-oShucATRgAkRB0v-A-JPH9DRnzELE4KsNArAR9mcDgDqTxdpQqDRoeHMCNTCNYCQUPJMKQoiJnhqGNLEEAA */
    tsTypes: {} as import("./basket.machine.typegen").Typegen0,
    id: "basketManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      basket: null,
      // ---
      items: [],
      bin: [],
      // ---
      // the generated summary of ALL the items,
      // including the totals formatted for display
      summary: null,
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
                        target: "#configuring",
                        actions: ["refreshItems", "updateBasket", "setError"]
                      }
                    }
                  },

                  currency: {
                    invoke: {
                      src: "setCurrency",
                      onDone: {
                        target: "#configuring",
                        actions: ["refreshItems", "updateBasket"]
                      },
                      onError: { target: "error", actions: ["setError"] }
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
                        target: "#configuring",
                        actions: ["refreshItems", "updateBasket", "setError"]
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
                        target: "#configuring",
                        actions: ["refreshItems", "updateBasket", "setError"]
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
              "UPDATE.CURRENCY": {
                target: "items.processing.currency"
              },
              CLEAR: {
                target: "items.processing",
                actions: ["removeAllItems"]
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
          promotions: {
            initial: "empty",
            states: {
              empty: {
                always: {
                  target: "active",
                  cond: "hasPromotions"
                },
                type: "final"
              },
              adding: {
                invoke: {
                  src: "addPromotion",
                  onDone: {
                    target: "active",
                    actions: ["refreshItems", "updateBasket"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError"]
                  }
                }
              },
              removing: {
                invoke: {
                  src: "removePromotion",
                  onDone: {
                    target: "empty",
                    actions: ["refreshItems", "updateBasket"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError"]
                  }
                }
              },
              error: {},
              active: {
                always: {
                  target: "empty",
                  cond: "hasNoPromotions"
                },
                type: "final"
              }
            },
            on: {
              "ADD.PROMOTION": { target: "promotions.adding" },
              "REMOVE.PROMOTION": { target: "promotions.removing" }
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
          UNAUTHENTICATED: { target: "#loading", actions: ["clearBasket"] },
          "CLEAR.ERRORS": { target: "#shopping", actions: ["clearError"] }
        },
        onDone: {
          // we are now ready for Checkout
          // target: "checkout"
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
        basket: (context, { data }) => data,
        summary: (context, { data }) => useSummaryParser(data),
        error: null
      }),

      updateBasket: assign({
        basket: (context, { data }) => {
          const value = get(data, "basket", context.basket);
          return useBasketParser(value);
        },
        summary: (context, { data }) => {
          const value = get(data, "basket", context.basket);
          return useSummaryParser(value);
        },
        error: null
      }),

      clearBasket: assign({
        basket: {},
        summary: useSummaryParser(),
        error: null
      }),

      // --- Configuring Items Actions

      loadItems: assign({
        items: ({ items, basket }, { data }) => {
          const products = data?.products || basket?.products || [];
          const promotions = data?.promotions || basket?.promotions || [];
          forEach(products, product => {
            // TODO: check if the item already exists
            // const item = find(items, ["id", product.id]);

            const machine = spawnConfiguration(
              product,
              basket?.currency_id,
              promotions
            );
            items.push(machine);
          });
          return items;
        },
        error: null
      }),

      addItem: assign({
        items: ({ items, basket }, { data }) => {
          const machine = spawnConfiguration(
            data,
            basket?.currency_id,
            basket?.promotions
          );
          items.push(machine);
          return items;
        },
        error: null
      }),

      // addAncillaryItems: assign({
      //   items: ({ items }, { data }) => {
      //     // if (!hasModuleEnabled("web_hosting")) return false;

      //     // const { basket, itemId, newId } = data;
      //     // const product = find(basket?.products, ["id", newId]);
      //     // const item = find(items, ["id", itemId]);

      //     // const replacements = filter(
      //     //   item.state?.context?.available?.provision_fields,
      //     //   ["semantic_type", SemanticTypes.DOMAIN_NAMES]
      //     // );

      //     // forEach(replacements, field => {
      //     //   console.log("Semantic replacement field", field);
      //     //   const value = get(item.state?.context, [
      //     //     "values",
      //     //     "provision_fields",
      //     //     field.name
      //     //   ]);

      //     //   // TODO: find a way to get the actual product that relats to this field
      //     //   const machine = spawnConfiguration({
      //     //     product_id: "78985742-6489-7012-096c-21e325d0ed36",
      //     //     provision_fields: {
      //     //       [field.name]: value
      //     //     },basket?.promotions
      //     //   });

      //     //   items.push(machine);
      //     // });

      //     // TODO:
      //     return items;
      //   }
      // }),

      binItem: assign({
        bin: ({ items, bin }, { data }) => {
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(items, ["id", itemId]);
          if (removed) removed.forEach(item => bin.push(item)); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return bin;
        },
        error: null
      }),

      removeAllItems: assign({
        items: ({ items, bin }, _event) => {
          forEach(items, item => item.stop());
          return [];
        },
        error: null
      }),

      removeItem: assign({
        items: ({ items }, { type, data }, _event) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(items, ["id", itemId]);
          if (removed) removed.forEach(item => item.stop()); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return items;
        },
        bin: ({ bin }, { data }, _event) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(bin, ["id", itemId]);
          if (removed) removed.forEach(item => item.stop()); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return bin;
        },
        error: null
      }),

      refreshItems: assign({
        items: ({ items, basket }, { data }) => {
          const promotions = data?.basket?.promotions || [];
          const currency_id = data?.basket?.currency_id;

          forEach(data?.items, (item, index) => {
            const itemId = item.id;
            const newId = get(data?.newItems, [index, "id"]);
            const product = find(data?.basket?.products, ["id", itemId]);

            // Check if the item still Exists in the basket
            if (product) {
              // Exists..
              // we need to refresh it
              item.send({
                type: "REFRESH",
                data: { product, currency_id, promotions }
              });
            }
            // if not, we need to check if its been Replaced
            else if (newId) {
              // Replaced...
              // we need to replace it with a new machine and stop the old one
              // NB: its safe to assume that the items array is in the same order as the newItems
              // so we can use the index to match the items
              if (item) item.stop(); // ensure the machine is stopped
              const currentIndex = findIndex(items, ["id", itemId]);
              const newProduct = find(data?.basket?.products, ["id", newId]);
              if (newProduct) {
                const machine = spawnConfiguration(
                  newProduct,
                  currency_id,
                  promotions
                );
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
            }
          });

          // ---
          // NB: do some housekeeping and ensure that we dont have any missing items
          const missing = differenceBy(data?.basket?.products, items, "id");
          forEach(missing, product => {
            const machine = spawnConfiguration(
              product,
              currency_id,
              promotions
            );
            items.push(machine);
          });

          // We need to refresh any machines that are not yet in the basket
          // but that are still being configured.
          // eg: weve added a product and it may be configuring or configured,
          // but weve not updated the basket yet
          // and perhaps weve changed currency or added a promotion
          // we need to ensure all the items are up to date
          // const dangling = differenceBy(
          //   items,
          //   [...data?.basket?.products, ...data.newItems],
          //   "id"
          // );
          // forEach(dangling, (item, index) => {
          //   debugger;
          //   const product = item.state.context.config;
          //   item.send({
          //     type: "REFRESH",
          //     data: { product, currency_id, promotions }
          //   });
          // });

          // ---
          return items;
        },
        error: null
      }),

      // ---

      sendToItem: sendTo(
        (_context, { data: { itemId } }) => itemId,
        (_context, { type, data }) => ({ type, data })
      ),

      // ---

      setError: assign({
        error: (context, { data }) => {
          const { items, newItems, error } = data;

          // if we are supplied a machine, we must forward/send the error to it
          if (items || newItems) {
            forEach(items.concat(newItems), item => {
              const found = find(context.items, ["id", item.id]);
              if (found) {
                waitFor(found, state =>
                  ["configured", "error"].some(state.matches)
                ).then(() => {
                  found.send({ type: "ERROR", data: { error: data.error } });
                });
              }
            });

            if (error.code == 422) {
              error.message = "Validation error";
            }
          } else if (error.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            return useValidationParser(error);
          }

          return error;
        }
      }),

      clearError: assign({ error: null })
    },
    guards: {
      hasNoBasket: ({ basket }) => isEmpty(basket),

      // --- Promotion gaurds

      hasNoPromotions: ({ basket }) => isEmpty(basket?.promotions),

      hasPromotions: ({ basket }) => !isEmpty(basket?.promotions),

      // --- Configuration Guards

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

      hasItems: ({ items }) => !isEmpty(items),

      hasNoItems: ({ items }) => isEmpty(items),

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
