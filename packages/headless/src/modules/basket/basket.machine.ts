// --- external
import { createMachine, assign, spawn } from "xstate";

// --- internal
import services from "./services";
import paymentMachine from "../payment/payment.machine";
import { useDataLayer } from "../system";
import { authSubscription } from "../session/helper";
const { dataLayer } = useDataLayer();

import { useFeedback } from "../feedback";
const { addError, addWarning } = useFeedback();

// --- utils
import {
  get,
  has,
  map,
  isNil,
  reduce,
  forEach,
  isArray,
  isEmpty,
  isEqual,
  includes
} from "lodash-es";
import {
  parseBasket,
  parseSummary,
  spawnBilling,
  spawnCurrency,
  spawnPromotions,
  spawnCustomFields,
  spawnPaymentDetails
} from "./utils";
import {
  useTime,
  stopActor,
  responseCodes,
  mapToHeadlessError
} from "../../utils";
import { parseBasketProduct } from "../basketProduct/utils";

// --- types
import type { Message } from "../feedback";
import type { BasketContext } from "./types";
import type { AnyEventObject } from "xstate";
import type { PaymentContext } from "../payment";
import { PaymentType, GatewayTypes } from "@upmind-automation/types";

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
          REFRESH: {
            // do nothing until we have a session
          },
          SESSION: {
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
            entry: ["clearError", "abortController"],
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
                entry: ["clearError", "abortController"],
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

          paymentDetails: {
            initial: "configuring",
            states: {
              configuring: {
                always: [{ target: "available", cond: "paymentDetailsValid" }]
              },

              available: {
                always: [
                  { target: "configuring", cond: "paymentDetailsConfiguring" }
                ],
                // ---
                // NB: Checkout is a chained sequence of events, that can only start once ALL the shopping details are complete
                // We must wait for the event to be triggered before we can proceed, othwerwise we may trigger checkout prematurely
                on: {
                  CHECKOUT: {
                    target: "processing",
                    actions: "forwardCheckout"
                  }
                }
              },

              processing: {
                on: {
                  CANCEL: {
                    target: "configuring"
                  },
                  // response from the paymentDetails machine = we are ready to convert
                  PAYMENT_DETAILS: {
                    target: "complete",
                    actions: ["setPaymentDetails", "pushPaymentDetails"],
                    cond: "paymentDetailsComplete"
                  }
                }
              },

              complete: {
                always: [
                  { target: "configuring", cond: "paymentDetailsConfiguring" }
                ],
                type: "final"
              }
            }
          }

          // ---
        },
        onDone: "checkout"
      },

      // We are now ready to accept payment as all the shopping details are complete
      // We will trigger checkout event to the paymentDetails machine
      // Which in turn will forward it to the payment_gateway machine
      // The payment_gateway machine will then run its process and when complete will return the Payload back to the paymentDetails machine
      // The paymentDetails machine will then Parse and return the response back to the basket machine
      // This will trigger the Convert service, which will then process the order
      checkout: {
        id: "checkout",
        always: {
          target: "converting",
          cond: "hasPaymentDetails"
        }
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
              cond: "paymentNeeded"
            },
            {
              target: "#complete",
              actions: ["setInvoice", "clearActors", "pushPurchase"]
            }
          ],
          onError: {
            target: "#shopping",
            actions: ["setError", "refreshActors"]
          }
        }
      },

      // We are now ready to actually process the payment for the order, based on the payment details provided
      paying: {
        id: "paying",
        invoke: {
          id: "payment",
          src: paymentMachine,
          data: ({ invoice, paymentDetails }: BasketContext) =>
            ({
              orderId: invoice?.id,
              address: invoice?.address,
              clientId: invoice?.client_id,
              currency: invoice?.currency,
              paymentDetail: paymentDetails
            }) as PaymentContext,
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
      // ---

      failed: {
        id: "failed"
      },
      // TODO: actual payment node.

      complete: {
        id: "complete"
        // type: "final"
      }
    },
    on: {
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

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearBasket", "clearActors"]
      }
    }
  },
  {
    actions: {
      setAuthHelper: assign({
        authHelper: ({ authHelper }: BasketContext, _event: AnyEventObject) =>
          authHelper ?? spawn(authSubscription)
      }),

      updateBasket: assign({
        basket: (_context: BasketContext, { data }: AnyEventObject) =>
          parseBasket(data),
        error: (_context: BasketContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data?.errors),
        products: (_context: BasketContext, { data }: AnyEventObject) => {
          const basket = parseBasket(data);
          const products = get(basket, "products", []);
          const errors = get(data, "errors");
          return map(products, product => parseBasketProduct(product, errors));
        },
        summary: (_context: BasketContext, { data }: AnyEventObject) => {
          const errors = get(data, "errors");
          return parseSummary(parseBasket(data), errors);
        }
      }),

      clearBasket: assign({
        basket: undefined,
        products: undefined,
        summary: undefined,
        error: undefined,
        paymentDetails: undefined,
        payment: undefined,
        invoice: undefined
      }),

      setPaymentDetails: assign({
        paymentDetails: (_context: BasketContext, { data }: AnyEventObject) =>
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
            billing: spawnBilling(basket),
            paymentDetails: spawnPaymentDetails(basket),
            currency: spawnCurrency(basket),
            customFields: spawnCustomFields(basket),
            promotions: spawnPromotions(basket)
          };

          return actors;
        }
      }),

      setWarningNotes: (context: BasketContext, { data }: AnyEventObject) => {
        const basket = get(data, "basket", data);
        if (has(basket, "warning_notes") && !isEmpty(basket.warning_notes)) {
          reduce(
            basket.warning_notes,
            (
              acc,
              note: { id: string; message: string; is_hidden: boolean }
            ) => {
              if (!note.is_hidden) {
                addWarning({
                  hash: note.id,
                  copy: note.message,
                  data: { persist: true },
                  actions: [
                    {
                      icon: "close",
                      label: "Dismiss",
                      value: "dismiss",
                      i18nKey: "basket.actions.dismiss",
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

      refreshActors: ({ basket, actors }: BasketContext) => {
        forEach(actors, actor => {
          if (actor?.send) actor.send({ type: "REFRESH", data: basket });
        });
      },

      clearActors: assign({
        actors: ({ actors }: BasketContext) => {
          forEach(actors, actor => stopActor(actor));
          return undefined;
        }
      }),

      forwardCheckout: ({ actors }: BasketContext) => {
        // for Now  only the payment details is affected by checkout
        actors?.paymentDetails.send({ type: "CHECKOUT" });
      },

      // ---

      abortController: assign({
        controller: ({ controller }: BasketContext) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return new AbortController();
        }
      }),

      // --- Datalayer
      // when a new product is added for configuration, but has not been saved/added to the basket

      // when the user enter a billing address
      pushShippingInfo: (_context: BasketContext, _event: AnyEventObject) => {
        dataLayer({ event: "add_shipping_info" }).withEcommerce().push();
      },

      // When a user enters their payment info
      pushPaymentDetails: (_context: BasketContext, _event: AnyEventObject) => {
        dataLayer({ event: "add_payment_info" }).withEcommerce().push();
      },

      // When a user completes their purchase, even if they have not paid
      pushPurchase: ({ invoice }: BasketContext, _event: AnyEventObject) => {
        dataLayer({ event: "purchase" }).withEcommerce(invoice).push();
      },

      // When a user completes their purchase
      pushPaid: ({ invoice }: BasketContext, _event: AnyEventObject) => {
        dataLayer({ event: "invoice_paid" }).withEcommerce(invoice).push();
      },

      // ---

      setFeedbackError: ({ error }: BasketContext, _event: AnyEventObject) => {
        if (
          !error ||
          isArray(error) || // we know this is going to be a validation error
          error?.status == responseCodes.Unprocessable_Entity ||
          error?.status == responseCodes.Unauthorized
        ) {
          return;
        }

        addError({
          title: "We experienced an error with the basket",
          copy: error?.message ?? undefined,
          data: error
        });
      },

      setError: assign({
        error: (_context: BasketContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),
      clearError: assign({ error: undefined })
    },

    guards: {
      hasAuthError: (_context: BasketContext, { data }: AnyEventObject) => {
        return data?.status == responseCodes.Unauthorized;
      },

      hasNewBasket: ({ basket }: BasketContext, { data }: AnyEventObject) =>
        !isEmpty(data) && !isEqual(basket, data),

      // --- Actor Guards
      currencyComplete: ({ actors }: BasketContext) => {
        return actors?.currency?.getSnapshot()?.matches("complete");
      },

      currencyConfiguring: ({ actors }: BasketContext) => {
        return !actors?.currency?.getSnapshot()?.matches("complete");
      },

      promotionsComplete: ({ actors }: BasketContext) => {
        // promotions should not hold up the process of checking out
        // unless it is in the process of being updated or loading
        return !["processing", "loading"].some(
          actors?.promotions?.getSnapshot()?.matches
        );
      },

      promotionsConfiguring: ({ actors }: BasketContext) => {
        return ["processing", "loading"].some(
          actors?.promotions?.getSnapshot()?.matches
        );
      },

      customFieldsComplete: ({ actors }: BasketContext) => {
        return actors?.customFields?.getSnapshot()?.matches("complete");
      },

      customFieldsConfiguring: ({ actors }: BasketContext) => {
        return !actors?.customFields?.getSnapshot()?.matches("complete");
      },

      billingComplete: ({ actors }: BasketContext) => {
        return actors?.billing?.getSnapshot()?.matches("complete");
      },

      billingConfiguring: ({ actors }: BasketContext) => {
        return !actors?.billing?.getSnapshot()?.matches("complete");
      },

      paymentDetailsValid: ({ actors }: BasketContext) => {
        return (
          actors?.paymentDetails?.getSnapshot()?.done ||
          actors?.paymentDetails?.getSnapshot()?.matches("available.valid")
        );
      },

      paymentDetailsComplete: (
        { actors }: BasketContext,
        { data }: AnyEventObject
      ) =>
        (actors?.paymentDetails?.getSnapshot()?.done ||
          actors?.paymentDetails?.getSnapshot()?.matches("complete")) &&
        !isEmpty(data),

      hasPaymentDetails: ({ paymentDetails }: BasketContext) =>
        !isNil(paymentDetails) && !isEmpty(paymentDetails),

      paymentDetailsConfiguring: ({ actors, paymentDetails }: BasketContext) =>
        isEmpty(paymentDetails) &&
        ["available.invalid", "available.checking", "available.loading"].some(
          actors?.paymentDetails?.getSnapshot()?.matches
        ),

      paymentNeeded: ({ paymentDetails }: BasketContext) => {
        const hasOutstandingBalance = paymentDetails?.amount ?? 0 > 0;

        const payingNow = paymentDetails?.type != PaymentType.PAY_LATER;

        const manualPayment = includes(
          [GatewayTypes.OFFLINE, GatewayTypes.BANK_TRANSFER],
          paymentDetails?.gateway?.type
        );

        return hasOutstandingBalance && payingNow && !manualPayment;
      },

      // --- Item Guards

      hasNoProducts: ({ products }) => isEmpty(products),
      hasProducts: ({ products }) => !isEmpty(products)
    },

    delays: {
      wait: () => useTime().WAIT
    },

    services
  }
);
