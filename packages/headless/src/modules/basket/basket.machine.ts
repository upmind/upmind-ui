// --- external
import { createMachine, assign, pure } from "xstate";

// --- internal
import services from "./services";
import paymentMachine from "../payment/payment.machine";

import { useFeedback } from "../feedback";
const { addError, trackEvent } = useFeedback();

// --- utils
import { useTime } from "../../utils";
import {
  parseBasket,
  parseBasketProduct,
  parseSummary,
  spawnBillingDetails,
  spawnCurrency,
  spawnCustomFields,
  spawnPaymentDetails,
  spawnProductConfiguration,
  spawnPromotions,
} from "./utils";

import {
  every,
  forEach,
  get,
  includes,
  isEmpty,
  isEqual,
  isNil,
  map,
  set,
} from "lodash-es";

// --- types
import type { ActorRef, AnyEventObject } from "xstate";
import type { BasketContext } from "./types";
import { responseCodes } from "../api";
import { PaymentType } from "@upmind-automation/types";
import { GatewayTypes } from "../paymentDetails/gateways/types";

// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./basket.machine.typegen").Typegen0,
    id: "basketManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      basket: undefined,
      invoice: undefined,
      address: undefined,
      // ---
      items: [],
      products: [],
      // ---
      actors: {
        billingDetails: undefined,
        currency: undefined,
        customFields: undefined,
        paymentDetails: undefined,
        promotions: undefined,
      },

      // ---
      // the generated summary of ALL the items,
      // including the totals formatted for display
      summary: undefined,
      // ---
      controller: undefined,
      error: undefined,
    } as BasketContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        invoke: {
          id: "authCallback",
          src: "authSubscription",
        },
        on: {
          SESSION: { target: "#loading" },
          ERROR: { target: "#error", actions: "setError" },
        },
      },
      // our initial state will check and see if we have an existing basket
      // if not, we dont generating a basket as this will inundate the backend with empty baskets
      // instead we will wait for an Action before we generate a basket
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
                actions: ["setError", "updateBasket"],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },

          actors: {
            entry: ["spawnActors"],
            always: [
              {
                target: "#shopping",
                cond: "isNotLoading",
              },
            ],
          },
        },
      },

      // if we dont have a basket, we can now generate one
      generating: {
        id: "generating",
        invoke: {
          src: "generate",
          onDone: {
            target: "shopping",
            actions: [
              "setError",
              "updateBasket",
              "refreshItems",
              "refreshActors",
            ],
          },
          onError: { target: "#error" },
        },
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
                      "refreshItems",
                      "refreshActors",
                    ],
                  },
                  onError: {
                    target: "complete",
                    actions: ["setError"],
                  },
                },
              },
              processed: {
                after: {
                  wait: {
                    target: "complete",
                  },
                },
              },
              complete: {
                type: "final",
              },
            },
          },

          account: {
            initial: "checking",
            states: {
              checking: {
                invoke: {
                  src: "isAuthenticated",
                  onDone: { target: "complete" },
                  onError: { target: "configuring" },
                },
              },
              configuring: {},
              claiming: {
                entry: ["abortController"],
                invoke: {
                  src: "load",
                  onDone: {
                    target: ["complete", "#refreshing.processing"],
                    actions: ["setError", "updateBasket", "refreshActors"],
                  },
                  onError: {
                    target: "#error",
                    actions: ["setError", "setFeedbackError"],
                  },
                },
              },
              complete: {
                type: "final",
              },
            },
            on: {
              AUTHENTICATED: { target: "account.claiming" },
            },
          },

          products: {
            initial: "configuring",
            states: {
              configuring: {
                id: "configuring",
                always: { target: "complete", cond: "hasProducts" },
              },

              complete: {
                always: [{ target: "configuring", cond: "hasNoProducts" }],
                type: "final",
              },
            },
          },

          currency: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "currencyComplete" },
              },

              complete: {
                always: [
                  { target: "configuring", cond: "currencyConfiguring" },
                ],
                type: "final",
              },
            },
          },

          promotions: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "promotionsComplete" },
              },

              complete: {
                always: [
                  { target: "configuring", cond: "promotionsConfiguring" },
                ],
                type: "final",
              },
            },
          },

          customFields: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "customFieldsComplete" },
              },

              complete: {
                always: [
                  { target: "configuring", cond: "customFieldsConfiguring" },
                ],
                type: "final",
              },
            },
          },

          billingDetails: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "billingComplete" },
              },

              complete: {
                always: [{ target: "configuring", cond: "billingConfiguring" }],
                type: "final",
              },
            },
          },

          paymentDetails: {
            initial: "configuring",
            states: {
              configuring: {
                always: [{ target: "available", cond: "paymentDetailsValid" }],
              },

              available: {
                always: [
                  { target: "configuring", cond: "paymentDetailsConfiguring" },
                ],
                // ---
                // NB: Checkout is a chained sequence of events, that can only start once ALL the shopping details are complete
                // We must wait for the event to be triggered before we can proceed, othwerwise we may trigger checkout prematurely
                on: {
                  CHECKOUT: {
                    target: "processing",
                    actions: "forwardCheckout",
                  },
                },
              },

              processing: {
                on: {
                  CANCEL: {
                    target: "configuring",
                  },
                  // response from the paymentDetails machine = we are ready to convert
                  PAYMENT_DETAILS: {
                    target: "complete",
                    actions: "setPaymentDetails",
                    cond: "paymentDetailsComplete",
                  },
                },
              },

              complete: {
                always: [
                  { target: "configuring", cond: "paymentDetailsConfiguring" },
                ],
                type: "final",
              },
            },
          },

          // ---
        },
        onDone: "checkout",
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
          cond: "hasPaymentDetails",
        },
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
              actions: ["setInvoice"],
              cond: "paymentNeeded",
            },
            {
              target: "#complete",
              actions: "setInvoice",
            },
          ],
          onError: {
            target: "#checkout",
            actions: ["setError", "setFeedbackError"],
          },
        },
      },

      // We are now ready to actually process the payment for the order, based on the payment details provided
      paying: {
        id: "paying",
        invoke: {
          id: "payment",
          src: paymentMachine,
          data: ({ invoice, paymentDetails }: BasketContext) => ({
            order: invoice,
            paymentDetails,
          }),
          onDone: {
            target: "#complete",
            actions: ["setPayment", "trackPayment"],
          },
          onError: {
            target: "#failed",
            actions: ["setError", "setFeedbackError"],
          },
        },
        on: {
          CANCEL: {
            target: "#checkout",
          },
        },
      },

      // Handle errors
      error: {
        id: "error",
      },
      // ---

      failed: {
        id: "failed",
      },
      // TODO: actual payment node.

      complete: {
        id: "complete",
        // type: "final"
      },
    },
    on: {
      ADD: [
        {
          target: "#generating",
          cond: "hasNoBasket",
          actions: ["addItem"],
        },
        { actions: ["addItem"] },
      ],
      CLEAR: {
        actions: ["clearItems"],
      },
      // ---

      REFRESH: [
        {
          target: "#refreshing.processing", // ideally we dont need to refresh cause the response has the updated basket WITH relations
          actions: ["updateBasket", "refreshActors"],
          cond: "hasNewBasket",
        },
        {
          target: "#refreshing.processing",
        },
      ],

      UNAUTHENTICATED: {
        target: "subscribing",
        actions: ["clearBasket", "clearActors", "clearItems"],
      },
    },
  },
  {
    actions: {
      updateBasket: assign({
        basket: (_context: BasketContext, { data }: AnyEventObject) =>
          parseBasket(data),
        error: ({ error }: BasketContext, { data }: AnyEventObject) => {
          error ??= {}; // safety check
          set(error, "provisioningErrors", get(data, "provisioningErrors"));
          return error;
        },
        products: (_context: BasketContext, { data }: AnyEventObject) => {
          const basket = parseBasket(data);
          const products = get(basket, "products", []);
          const provisioningErrors = get(data, "provisioningErrors");
          return map(products, product =>
            parseBasketProduct(product, provisioningErrors)
          );
        },
        summary: (_context: BasketContext, { data }: AnyEventObject) => {
          const provisioningErrors = get(data, "provisioningErrors");
          return parseSummary(parseBasket(data), provisioningErrors);
        },
      }),

      clearBasket: assign({
        basket: undefined,
        products: undefined,
        summary: undefined,
        error: undefined,
        paymentDetails: undefined,
        payment: undefined,
        invoice: undefined,
      }),

      setPaymentDetails: assign({
        paymentDetails: (_context: BasketContext, { data }: AnyEventObject) =>
          data,
      }),

      setInvoice: assign({
        invoice: (_context: BasketContext, { data }: AnyEventObject) => data,
        basket: undefined,
        summary: undefined,
        items: ({ items }: BasketContext, _event) => {
          forEach(items, (actor: ActorRef<any>) => {
            if (!actor.getSnapshot()?.done && actor?.stop) actor.stop();
          });
          return [];
        },
        actors: ({ actors }) => {
          forEach(actors, (actor: any) => {
            if (!actor?.state?.done && actor?.stop) actor.stop();
          });
          return {
            billingDetails: undefined,
            currency: undefined,
            customFields: undefined,
            paymentDetails: undefined,
            promotions: undefined,
          };
        },
        // error: undefined,
      }),

      setPayment: assign({
        payment: (_context: BasketContext, { data }: AnyEventObject) => data,
      }),

      trackPayment: ({ invoice }: any, { data }: any) => {
        trackEvent({
          event: "payment",
          upmind: {
            user_id: data?.actor_id,
            ecommerce: {
              currency: invoice.currency.code,
              tax: invoice.tax_amount_converted,
              value: invoice.net_amount_converted,
              transaction_id: invoice.number,
              items: map(invoice.products, product => ({
                item_id: product.product.id,
                item_name: product.product.name, // For reporting purposes we intentionally pass untranslated product name
                item_category: product.product.category.name, // For reporting purposes we intentionally pass untranslated category name
                quantity: product.quantity,
                discount: product.configuration_net_amount_discount_converted,
                price: product.configuration_net_amount_converted,
              })),
            },
          },
        });
      },

      // --- Spawned Actors Actions
      spawnActors: assign({
        actors: ({ actors, basket }: BasketContext) => {
          // only spawn if we have not already spawned
          actors.billingDetails ??= spawnBillingDetails(basket);
          actors.currency ??= spawnCurrency(basket);
          actors.customFields ??= spawnCustomFields(basket);
          actors.paymentDetails ??= spawnPaymentDetails(basket);
          actors.promotions ??= spawnPromotions(basket);

          return actors;
        },
      }),

      refreshActors: ({ basket, actors }: BasketContext) => {
        forEach(actors, actor => {
          if (actor?.send && !actor.getSnapshot()?.done) {
            actor.send({ type: "REFRESH", data: basket });
          }
        });
      },

      clearActors: assign({
        actors: ({ actors }: any) => {
          forEach(actors, actor => {
            if (!actor?.state?.done && actor?.stop) {
              actor?.stop();
            }
          });

          return {
            billingDetails: undefined,
            currency: undefined,
            customFields: undefined,
            paymentDetails: undefined,
            promotions: undefined,
          };
        },
      }),

      forwardCheckout: pure(({ actors }): any => {
        // for Now  only the payment details is affected by checkout
        actors?.paymentDetails?.send({ type: "CHECKOUT" });
      }),

      // --- Configuring Items Actions

      addItem: assign({
        items: ({ items, basket }: BasketContext, { data }: AnyEventObject) => {
          const machine = spawnProductConfiguration(data, basket);

          items ??= [];
          items.push(machine);
          return items;
        },
      }),

      refreshItems: assign({
        items: ({ basket, items }: BasketContext) => {
          const newItems: ActorRef<any>[] = [];

          forEach(items, actor => {
            if (!actor?.getSnapshot()?.done) {
              newItems.push(actor);

              actor.send({
                type: "REFRESH",

                data: {
                  id: basket?.id,
                  currencyId: basket?.currency_id,
                  promotions: map(basket?.promotions, "promotion.code"),
                },
              });
            } else {
              // remove(items, actor);
            }
          });

          return newItems;
        },
      }),

      clearItems: assign({
        items: ({ items }: BasketContext, _event) => {
          forEach(items, item => {
            if (item?.send && !item?.getSnapshot()?.done) {
              item.send({ type: "REMOVE" });
            }
          });
          return [];
        },
      }),

      // ---

      abortController: assign({
        controller: ({ controller }: BasketContext) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return new AbortController();
        },
      }),

      // ---
      // setFeedbackSuccess: (_context: BasketContext, _event: AnyEventObject) => {
      //   addSuccess("Successfully updated the basket");
      // },

      setFeedbackError: ({ error }: BasketContext, _event: AnyEventObject) => {
        if (
          !error ||
          error?.code == responseCodes.Unprocessable_Entity ||
          error?.code == responseCodes.Unauthorized
        )
          return;

        addError({
          title: error?.title || "We experienced an error updating the basket",
          copy: error?.message,
          data: error?.data,
        });
      },

      setError: assign({
        error: (_context: BasketContext, { data }: AnyEventObject) =>
          data?.error || data || undefined,
      }),

      clearError: assign({ error: undefined }),
    },

    guards: {
      hasNoBasket: ({ basket }: BasketContext) => isEmpty(basket),

      hasNewBasket: ({ basket }: BasketContext, { data }: AnyEventObject) =>
        !isEmpty(data) && !isEqual(basket, data),

      // --- Actor Guards
      currencyComplete: ({ actors }: BasketContext) => {
        return actors.currency?.getSnapshot()?.matches("complete");
      },

      currencyConfiguring: ({ actors }: BasketContext) => {
        return !actors.currency?.getSnapshot()?.matches("complete");
      },

      promotionsComplete: ({ actors }: BasketContext) => {
        // promotions should not hold up the process of checking out
        // unless it is in the process of being updated or loading
        return !["processing", "loading"].some(
          actors.promotions?.getSnapshot()?.matches
        );
      },

      promotionsConfiguring: ({ actors }: BasketContext) => {
        return ["processing", "loading"].some(
          actors.promotions?.getSnapshot()?.matches
        );
      },

      customFieldsComplete: ({ actors }: BasketContext) => {
        return actors.customFields?.getSnapshot()?.matches("complete");
      },

      customFieldsConfiguring: ({ actors }: BasketContext) => {
        return !actors.customFields?.getSnapshot()?.matches("complete");
      },

      billingComplete: ({ actors }: BasketContext) => {
        return actors.billingDetails?.getSnapshot()?.matches("complete");
      },

      billingConfiguring: ({ actors }: BasketContext) => {
        return !actors.billingDetails?.getSnapshot()?.matches("complete");
      },

      paymentDetailsValid: ({ actors }: BasketContext) => {
        return (
          actors.paymentDetails?.getSnapshot()?.done ||
          actors.paymentDetails?.getSnapshot()?.matches("available.valid")
        );
      },

      paymentDetailsComplete: (
        { actors }: BasketContext,
        { data }: AnyEventObject
      ) => {
        const value =
          (actors.paymentDetails?.getSnapshot()?.done ||
            actors.paymentDetails?.getSnapshot()?.matches("complete")) &&
          !isEmpty(data);

        return value;
      },

      hasPaymentDetails: ({ paymentDetails }: BasketContext) => {
        const value = !isNil(paymentDetails) && !isEmpty(paymentDetails);

        return value;
      },

      paymentDetailsConfiguring: ({
        actors,
        paymentDetails,
      }: BasketContext) => {
        return (
          isEmpty(paymentDetails) &&
          ["available.invalid", "available.checking", "available.loading"].some(
            actors.paymentDetails?.getSnapshot()?.matches
          )
        );
      },

      paymentNeeded: ({ paymentDetails }: BasketContext) => {
        const hasOustandingBalance = paymentDetails?.amount ?? 0 > 0;

        const payingNow = paymentDetails?.type != PaymentType.PAY_LATER;

        const manualPayment = includes(
          [GatewayTypes.OFFLINE, GatewayTypes.BANK_TRANSFER],
          paymentDetails?.gateway?.type
        );

        const value = hasOustandingBalance && payingNow && !manualPayment;

        // console.debug("paymentNeeded", value, {
        //   hasOustandingBalance,
        //   payingNow,
        //   manualPayment,
        //   paymentDetails,
        // });

        return value;
      },

      // --- Item Guards

      isNotLoading: ({ items }) => {
        return every(
          items,
          actor =>
            !["subscribing", "loading"].some(actor?.getSnapshot().matches)
        );
      },

      hasNoProducts: ({ products }) => isEmpty(products),
      hasProducts: ({ products }) => !isEmpty(products),
    },

    delays: {
      wait: () => useTime().WAIT,
    },

    services,
  }
);
