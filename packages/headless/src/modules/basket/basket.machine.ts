// --- external
import { createMachine, assign, spawn } from "xstate";

// --- internal
import services from "./services";
import paymentMachine from "../payment/payment.machine";
import { useDataLayer, useI18n } from "../system";
import { authSubscription } from "../session/helper";
import { useSession } from "../session";

import { useFeedback } from "../feedback";

// --- utils
import {
  defaultsDeep,
  forEach,
  get,
  has,
  isEmpty,
  isEqual,
  map,
  reduce,
  some
} from "lodash-es";
import {
  parseBasket,
  parseSummary,
  spawnBilling,
  spawnCurrency,
  spawnPromotions,
  spawnCustomFields,
  spawnPaymentDetail
} from "./utils";
import {
  useTime,
  responseCodes,
  mapToHeadlessError,
  stopService,
  stateMatches,
  isStoppedService
} from "../../utils";
import { parseBasketProduct } from "../basketProduct/utils";

// --- types
import type { Message } from "../feedback";
import type { BasketContext } from "./types";
import type { AnyEventObject } from "xstate";
import type { PaymentArgs } from "../payment";
import { useQuery } from "../query";
import { GatewayContext } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    id: "basketManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as BasketContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        id: "subscribing",
        entry: ["setAuthHelper"],
        on: {
          /**
           * Accept target basket ID while still waiting for a session.
           * No auth guard, no transition — just store the ID so the first
           * `load` invocation after AUTHENTICATED already uses `orders/{id}`.
           */
          SET_TARGET_BASKET: {
            actions: ["setTargetBasketId"]
          },
          REFRESH: {
            // do nothing until we have a session
          },
          SESSION: [
            {
              // If we have a target basket, do NOT load yet — wait for AUTHENTICATED
              // because a specific basket requires client auth, not a guest token.
              cond: "hasTargetBasketId"
            },
            { target: "#loading" }
          ],
          /**
           * When a target basket is pending, AUTHENTICATED is the signal
           * that the client token is available and we can safely load `orders/{id}`.
           */
          AUTHENTICATED: {
            target: "#loading"
          }
        }
      },
      // our initial state will check and see if we have an existing basket
      // if not we will try claim one if we are logged in,otherwise we will generate a new one
      loading: {
        id: "loading",
        initial: "basket",
        states: {
          basket: {
            entry: ["cancelExistingQuery"],
            invoke: {
              src: "load",
              onDone: {
                target: "actors",
                actions: ["updateBasket", "setWarningNotes"]
              },
              onError: [
                {
                  target: "#subscribing",
                  cond: "hasAuthError"
                },
                {
                  target: "#unavailable",
                  cond: "hasInvalidTargetBasket"
                },
                {
                  target: "#error",
                  actions: ["updateBasket", "setWarningNotes"]
                }
              ]
            }
          },

          actors: {
            entry: ["spawnActors"],
            always: [
              {
                target: "#shopping"
              }
            ]
          }
        }
      },

      // We are now ready to start ALL the shopping operations
      shopping: {
        id: "shopping",
        type: "parallel",
        states: {
          // after we do any operation that requires a refresh, we will refresh the basket and then refresh the actors
          refreshing: {
            id: "refreshing",
            initial: "complete",
            states: {
              processing: {
                entry: ["cancelExistingQuery", "notifyActorsRefreshing"],
                invoke: {
                  src: "refresh",
                  onDone: {
                    target: "processed",
                    actions: [
                      "setError",
                      "updateBasket",
                      "refreshActors",
                      "setWarningNotes"
                    ]
                  },
                  onError: {
                    target: "complete",
                    actions: ["setError"]
                  }
                }
              },
              processed: {
                after: {
                  wait: {
                    target: "complete"
                  }
                }
              },
              complete: {
                type: "final"
              }
            }
          },

          account: {
            initial: "checking",
            states: {
              checking: {
                invoke: {
                  src: "isAuthenticated",
                  onDone: { target: "complete" },
                  onError: { target: "configuring" }
                }
              },
              configuring: {},
              complete: {
                type: "final"
              }
            },
            on: {
              AUTHENTICATED: {
                target: ["account.checking", "#refreshing.processing"]
              }
            }
          },

          products: {
            initial: "configuring",
            states: {
              configuring: {
                id: "configuring",
                always: { target: "complete", cond: "hasProducts" }
              },
              complete: {
                always: [{ target: "configuring", cond: "hasNoProducts" }],
                type: "final"
              }
            }
          },

          currency: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "currencyComplete" }
              },

              complete: {
                always: [
                  { target: "configuring", cond: "currencyConfiguring" }
                ],
                type: "final"
              }
            }
          },

          promotions: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "promotionsComplete" }
              },

              complete: {
                always: [
                  { target: "configuring", cond: "promotionsConfiguring" }
                ],
                type: "final"
              }
            }
          },

          customFields: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "customFieldsComplete" }
              },

              complete: {
                always: [
                  { target: "configuring", cond: "customFieldsConfiguring" }
                ],
                type: "final"
              }
            }
          },

          billing: {
            initial: "configuring",
            states: {
              configuring: {
                always: {
                  target: "complete",
                  actions: ["pushShippingInfo"],
                  cond: "billingComplete"
                }
              },

              complete: {
                entry: [],
                always: [
                  {
                    target: "configuring",
                    cond: "billingConfiguring"
                  }
                ],
                type: "final"
              }
            }
          },

          paymentDetail: {
            initial: "configuring",
            states: {
              configuring: {
                always: [{ target: "available", cond: "paymentDetailValid" }]
              },

              available: {
                always: [
                  { target: "configuring", cond: "paymentDetailConfiguring" }
                ]
              },

              processing: {
                on: {
                  CANCEL: {
                    target: "configuring"
                  }
                }
              },

              complete: {
                always: [
                  { target: "configuring", cond: "paymentDetailConfiguring" }
                ],
                type: "final"
              }
            },
            // ---
            // NB: Checkout is a chained sequence of events, that can only start once ALL the shopping details are complete
            // We must wait for the event to be triggered before we can proceed, othwerwise we may trigger checkout prematurely
            on: {
              // NB: Handled at this level (not inside processing) because offsite
              // gateway redirects cause the paymentDetail actor to restore and
              // complete before the basket has entered processing via CHECKOUT.
              PAYMENT_DETAILS: {
                target: ".complete",
                actions: ["setPaymentDetail", "pushPaymentDetail"],
                cond: "paymentDetailComplete"
              },
              CHECKOUT: [
                {
                  target: ".processing",
                  actions: "forwardCheckout",
                  cond: "canCheckout"
                },
                {
                  actions: "incrementAttempts"
                }
              ]
            }
          }

          // ---
        },
        on: {
          // By definition we cannot checkout until payment details are available AND all shopping details are complete
          // so we will just count the attempts here so we understand that user tried to checkout but was not ready
          CHECKOUT: {
            actions: ["incrementAttempts"]
          }
        },
        onDone: "checkout"
      },

      // We are now ready to accept payment as all the shopping details are complete
      // We will trigger checkout event to the paymentDetail machine
      // Which in turn will forward it to the payment_gateway machine
      // The payment_gateway machine will then run its process and when complete will return the Payload back to the paymentDetail machine
      // The paymentDetail machine will then Parse and return the response back to the basket machine
      // This will trigger the Convert service, which will then process the order
      checkout: {
        id: "checkout",
        always: [
          {
            target: "#shopping",
            cond: "hasLockedProducts"
          },
          {
            target: "converting",
            cond: "paymentDetailComplete"
          }
        ]
      },

      // We are now ready to convert the basket into an invoice and effectively end the basket AND the shopping process
      // at this stage we will also check if we need to pay for the order, if so we will trigger the payment machine
      // if not we will go straight to the complete state
      converting: {
        id: "converting",
        invoke: {
          src: "convert",
          onDone: [
            {
              target: "#paying",
              actions: ["setInvoice", "clearActors", "pushPurchase"],
              cond: "needsPayment"
            },
            {
              target: "#complete",
              actions: ["setInvoice", "clearActors", "pushPurchase"]
            }
          ],
          onError: {
            target: "#shopping",
            actions: [
              "setError",
              "incrementAttempts",
              "restartActors",
              "refreshActors",
              "setWarningNotes"
            ]
          }
        }
      },

      // We are now ready to actually process the payment for the order, based on the payment details provided
      paying: {
        id: "paying",
        invoke: {
          id: "payment",
          src: paymentMachine,
          data: ({ invoice, paymentDetail }: BasketContext) => {
            return {
              orderId: invoice?.id,
              paymentDetail: paymentDetail
            } as PaymentArgs;
          },
          onDone: {
            target: "#complete",
            actions: ["setPayment", "pushPaid"]
          },
          onError: {
            target: "#failed",
            actions: ["setError"]
          }
        },
        on: {
          CANCEL: {
            target: "#checkout"
          }
        }
      },

      // Handle errors
      error: {
        id: "error"
      },

      unavailable: {
        id: "unavailable"
      },
      // ---

      failed: {
        id: "failed"
      },

      complete: {
        id: "complete"
      }
    },
    on: {
      // restart the baslket process once the order is complete
      RESET: {
        target: "loading",
        actions: ["clearBasket", "clearActors"]
      },

      /**
       * CLEAR is used to reset the basket and clear the target basket ID.
       * This reverts the basket to loading `orders/current` instead of a specific basket.
       */
      CLEAR: {
        target: "loading",
        actions: ["clearBasket", "clearActors"]
      },

      /**
       * SET_TARGET_BASKET is used to set a specific basket ID to load via URL.
       * It stores the ID in context and reloads the basket from the server
       * using `orders/{targetBasketId}` instead of `orders/current`.
       */
      SET_TARGET_BASKET: {
        target: "loading",
        actions: ["clearBasket", "clearActors", "setTargetBasketId"],
        cond: "isAuthenticated"
      },

      REFRESH: [
        {
          target: "#refreshing.processing", // ideally we dont need to refresh cause the response has the updated basket WITH relations
          actions: ["updateBasket", "refreshActors", "setWarningNotes"],
          cond: "hasNewBasket"
        },

        {
          target: "#refreshing.processing"
        }
      ],

      /**
       * PREFRESH is used when we want to update the basket with new data
       * PRIOR to the main refresh occuring. This is a optimisation to ensure
       * that any changes are applied immediately, and then the refresh can
       * confirm/adjust as needed
       */
      PREFRESH: [
        {
          actions: ["updateBasket", "prefreshActors"],
          cond: "hasNewBasket"
        }
      ],

      UNAUTHENTICATED: {
        target: "subscribing",
        actions: ["clearBasket", "clearActors"]
      }
    }
  },
  {
    actions: {
      setAuthHelper: assign({
        authHelper: ({ authHelper }: BasketContext, _event: AnyEventObject) =>
          authHelper ?? spawn(authSubscription),
        resetHelper: ({ resetHelper }: BasketContext) =>
          resetHelper ??
          spawn((callback: any, onReceive: any) => {
            onReceive((event: any) => callback(event));
          })
      }),

      updateBasket: assign({
        basket: ({ basket }: BasketContext, { data }: AnyEventObject) =>
          parseBasket(data, basket),
        error: (_context: BasketContext, { data }: AnyEventObject) =>
          get(data, "errors"), //NB: these are already mapped in the service, so no need to map them again
        products: ({ basket }: BasketContext, { data }: AnyEventObject) => {
          const mergedBasket = parseBasket(data, basket);
          const products = get(mergedBasket, "products", []);
          const errors = get(data, "errors");
          return map(products, product => parseBasketProduct(product, errors));
        },
        summary: ({ basket }: BasketContext, { data }: AnyEventObject) => {
          const mergedBasket = parseBasket(data, basket);
          const errors = get(data, "errors");
          return parseSummary(mergedBasket, errors);
        }
      }),

      clearBasket: assign({
        basket: undefined,
        products: undefined,
        summary: undefined,
        error: undefined,
        paymentDetail: undefined,
        payment: undefined,
        invoice: undefined,
        targetBasketId: undefined
      }),

      setPaymentDetail: assign({
        paymentDetail: (_context: BasketContext, { data }: AnyEventObject) =>
          data
      }),

      setInvoice: assign({
        basket: undefined,
        summary: undefined,
        products: undefined,
        error: undefined,
        invoice: (_context: BasketContext, { data }: AnyEventObject) => data
      }),

      setPayment: assign({
        payment: (_context: BasketContext, { data }: AnyEventObject) => data
      }),

      // --- Spawned Actors Actions

      spawnActors: assign({
        actors: ({ actors, basket }: BasketContext) => {
          // only spawn if we have not already spawned
          actors ??= {
            currency: spawnCurrency(basket),
            customFields: spawnCustomFields(basket),
            promotions: spawnPromotions(basket)
          };

          // NB : We need to check/ensure  we only spawn if we have a 'claimed' basket, ie a client_id
          if (basket?.client_id) {
            actors!.billing ??= spawnBilling(basket);
            actors!.paymentDetail ??= spawnPaymentDetail(basket);
          }

          return actors;
        }
      }),

      setWarningNotes: (context: BasketContext, { data }: AnyEventObject) => {
        const { t } = useI18n();
        const basket = get(data, "basket", data);
        if (has(basket, "warning_notes") && !isEmpty(basket.warning_notes)) {
          reduce(
            basket.warning_notes,
            (
              acc,
              note: { id: string; message: string; is_hidden: boolean }
            ) => {
              if (!note.is_hidden) {
                useFeedback().addWarning({
                  hash: note.id,
                  copy: note.message,
                  data: { persist: true },
                  actions: [
                    {
                      icon: "close",
                      label: t("action.dismiss"),
                      value: "dismiss",
                      handler: async (ctx: Message) => {
                        services.dismissWarningNotes(context, {
                          type: "DISMISS_WARNING",
                          data: ctx.hash
                        });
                      }
                    }
                  ]
                });
              }
              return acc;
            },
            null
          );
        }
      },

      restartActors: assign({
        actors: ({ actors, basket, error }: BasketContext) => {
          // safety check - if we have no actors, then spawn them all
          const activeActors: BasketContext["actors"] = {
            currency:
              !actors?.currency || isStoppedService(actors.currency)
                ? spawnCurrency(basket)
                : actors.currency,
            customFields:
              !actors?.customFields || isStoppedService(actors.customFields)
                ? spawnCustomFields(basket, error)
                : actors.customFields,
            promotions:
              !actors?.promotions || isStoppedService(actors.promotions)
                ? spawnPromotions(basket)
                : actors.promotions,
            paymentDetail:
              !actors?.paymentDetail || isStoppedService(actors.paymentDetail)
                ? spawnPaymentDetail(basket)
                : actors.paymentDetail,
            billing:
              !actors?.billing || isStoppedService(actors.billing)
                ? spawnBilling(basket)
                : actors.billing
          };

          return activeActors;
        }
      }),

      /**
       * Broadcasts `REFRESHING` to all spawned children (currency,
       * customFields, promotions, billing, paymentDetail) at the start of
       * every basket refresh cycle, before the API call resolves.
       *
       * Purpose: subscribers stage their own state ahead of the eventual
       * `REFRESH` — e.g. the recommendations engine moves to a `syncing`
       * state and blocks `isReady()` so route gates don't redirect based
       * on stale conditions during the basket's in-flight window.
       *
       * Distinct from `PROCESSING` (which signals "this specific product
       * is being updated" and locks the product card UI). `REFRESHING` is
       * basket-wide and non-locking.
       *
       * Lifecycle: REFRESHING → (basket API call) → REFRESH (via
       * `refreshActors`). External subscribers receive the same signal
       * through the `basketSubscription` helper. Children/subscribers
       * that don't handle `REFRESHING` silently ignore it.
       */
      notifyActorsRefreshing: ({ actors }: BasketContext) => {
        forEach(actors, actor => {
          if (actor?.send) actor.send({ type: "REFRESHING" });
        });
      },

      refreshActors: assign({
        actors: ({ actors, basket, error }: BasketContext) => {
          //Refresh any existing actors with the new basket data
          forEach(actors, actor => {
            if (actor?.send)
              actor.send({
                type: "REFRESH",
                data: {
                  ...basket,
                  error
                }
              });
          });

          // And then check/ensure we have spawned any missing actors
          // NB : We need to check/ensure  we only spawn if we have a 'claimed' basket, ie a client_id
          if (basket?.client_id) {
            actors!.billing ??= spawnBilling(basket);
            actors!.paymentDetail ??= spawnPaymentDetail(basket);
          }

          return actors;
        }
      }),

      prefreshActors: assign({
        actors: (
          { actors, basket }: BasketContext,
          { data }: AnyEventObject
        ) => {
          //Refresh any existing actors with the new basket data
          forEach(actors, actor => {
            if (actor?.send)
              actor.send({ type: "REFRESH", data: defaultsDeep(data, basket) });
          });

          return actors;
        }
      }),

      clearActors: assign({
        actors: ({ actors }: BasketContext) => {
          forEach(actors, actor => {
            if (actor) stopService(actor);
          });
          return undefined;
        }
      }),

      forwardCheckout: ({ actors }: BasketContext) => {
        actors?.paymentDetail?.send({ type: "PAY" });
      },

      // ---
      /** Cancel any existing query to prevent multiple queries */
      cancelExistingQuery: (context: BasketContext, _event: AnyEventObject) => {
        const { cancel } = useQuery();
        cancel(["basket"]);
      },

      // --- Datalayer
      // when a new product is added for configuration, but has not been saved/added to the basket

      // when the user enter a billing address
      pushShippingInfo: (_context: BasketContext, _event: AnyEventObject) => {
        useDataLayer()
          .dataLayer({ event: "add_shipping_info" })
          .withEcommerce()
          .push();
      },

      // When a user enters their payment info
      pushPaymentDetail: (_context: BasketContext, _event: AnyEventObject) => {
        useDataLayer()
          .dataLayer({ event: "add_payment_info" })
          .withEcommerce()
          .push();
      },

      // When a user completes their purchase, even if they have not paid
      pushPurchase: ({ invoice }: BasketContext, _event: AnyEventObject) => {
        useDataLayer()
          .dataLayer({ event: "purchase" })
          .withEcommerce(invoice)
          .push();
      },

      // When a user completes their purchase
      pushPaid: ({ invoice }: BasketContext, _event: AnyEventObject) => {
        useDataLayer()
          .dataLayer({ event: "invoice_paid" })
          .withEcommerce(invoice)
          .push();
      },

      // ---

      incrementAttempts: assign({
        attempts: ({ attempts }: BasketContext) => {
          attempts = attempts ?? 0;
          attempts++;
          return attempts;
        }
      }),

      setError: assign({
        error: (_context: BasketContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      clearError: assign({ error: undefined }),

      setTargetBasketId: assign({
        targetBasketId: (_context: BasketContext, { data }: AnyEventObject) =>
          data ?? undefined
      })
    },

    guards: {
      hasAuthError: (_context: BasketContext, { data }: AnyEventObject) => {
        return data?.status == responseCodes.Unauthorized;
      },

      hasNewBasket: ({ basket }: BasketContext, { data }: AnyEventObject) =>
        !isEmpty(data) && !isEqual(basket, data),

      // --- Actor Guards
      currencyComplete: ({ actors }: BasketContext) =>
        stateMatches(actors?.currency, ["complete", "done"]),

      currencyConfiguring: ({ actors }: BasketContext) =>
        !stateMatches(actors?.currency, ["complete", "done"]),

      // promotions should not hold up the process of checking out
      // unless it is in the process of being updated or loading
      promotionsComplete: ({ actors }: BasketContext) =>
        stateMatches(actors?.promotions, ["complete", "done"]),

      promotionsConfiguring: ({ actors }: BasketContext) =>
        stateMatches(actors?.promotions, ["processing", "loading"]),

      customFieldsComplete: ({ actors }: BasketContext) =>
        stateMatches(actors?.customFields, ["complete", "done"]),

      customFieldsConfiguring: ({ actors }: BasketContext) =>
        !stateMatches(actors?.customFields, ["complete", "done"]),

      billingComplete: ({ actors }: BasketContext) =>
        !!actors?.billing && stateMatches(actors.billing, ["complete", "done"]),

      billingConfiguring: ({ actors }: BasketContext) =>
        !actors?.billing || !stateMatches(actors.billing, ["complete", "done"]),

      paymentDetailValid: ({ actors }: BasketContext) => {
        const valid = stateMatches(actors?.paymentDetail?.getSnapshot(), [
          "available.valid",
          "unavailable",
          "done",
          "complete"
        ]);

        return valid;
      },

      paymentDetailConfiguring: ({ actors, paymentDetail }: BasketContext) => {
        const valid = stateMatches(actors?.paymentDetail, [
          "available.invalid",
          "available.checking",
          "available.loading"
        ]);

        return valid;
      },

      paymentDetailComplete: (
        { actors }: BasketContext,
        _event: AnyEventObject
      ) => stateMatches(actors?.paymentDetail, ["complete", "done"]),

      canCheckout: ({ actors, products }: BasketContext) => {
        const hasBilling =
          !!actors?.billing &&
          stateMatches(actors.billing, ["complete", "done"]);

        const hasFields = stateMatches(actors?.customFields, [
          "complete",
          "done"
        ]);

        const hasProducts = !isEmpty(products);

        return hasBilling && hasFields && hasProducts;
      },

      hasLockedProducts: ({ products }: BasketContext) =>
        some(products, p => !!p?.productDetails?.readonly),

      needsPayment: ({ paymentDetail }: BasketContext) =>
        !isEmpty(paymentDetail),
      // --- Item Guards

      hasInvalidTargetBasket: (
        _context: BasketContext,
        { data }: AnyEventObject
      ) => !!data?.targetBasketInvalid,

      hasTargetBasketId: ({ targetBasketId }: BasketContext) =>
        !isEmpty(targetBasketId),

      hasNoProducts: ({ products }) => isEmpty(products),
      hasProducts: ({ products }) => !isEmpty(products),

      isAuthenticated: () => {
        const { meta } = useSession();
        return meta.value.isAuthenticated;
      }
    },

    delays: {
      wait: () => useTime().WAIT
    },

    services
  }
);
