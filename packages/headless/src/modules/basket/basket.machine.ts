// --- external
import { createMachine, assign, pure } from "xstate";

// --- internal
import services from "./services";
import paymentMachine from "../payment/payment.machine";

import { useFeedback } from "../feedback";
const { addError, addSuccess, trackEvent } = useFeedback();

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
import type { ActorRef } from "xstate";
import type { BasketContext, BasketEvent } from "./types";
import { responseCodes } from "../api";
import { PaymentType, GatewayTypes } from "@upmind-automation/types";
// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCMCGsDWYAuBZVAdqjAE4B0sArsrAMYkCWyDBUAxAMoCiHHAkgHkAcgG0ADAF1EoAA4B7WA2wM5BaSAAeiAEwB2XQGYyATgMGxYgGwBGAKy6ALGIO6ANCACeic9qPGxABxi1rrWDuZixpYAvtHuaJg4+ESkZAA2cqgQLOwQqmBkLABuclhkCVh4hMRg5BlZOQjFcrSoyqriEp3q8ortakiaiLba7l4IBtYG2mTONsbaDgFRAXax8eiVyTV1mdmsbLUkcuQyaW0AZicAtuWbSdWp9ftQTQQlrf2d3YO9SioDUBaCZTBwmIJRFy2Bz2fRjHTGfxkSwjMJmawWALrEAVB4pWpkWjnBjXHJsPIEArNMq4qr48hE1AkxrNT4A76SHoKf6qdTAxYOMGWSzaazGAIGEXhMLwhDaSwBMgBXSRYy2AKWMy2WwGWzY2nbVKM5kHI4nMhnS43O6JOk7QnE0msN4fNrsyQ-WTc-p8nS6cVkPQ6jEhUJ2WW+CWzCWC+xS9W6fX3O2pGCUkhug4UqnvUoFA2PAlp2qZ16st0dD2c37egG+hAjWWrMjTbQLTULXTzAxJ22GotgdOlw4kY6nc7YK4kW4F+lkYsZ5TO8tfKtSGt9OuDfkBeyB4UGDVTbTaWzGWXWAJg8K2ZyIqx6BxhXtbQvkWAACzkMhkZOzFGwNp82Tft3y-H8ck9EA-h9bcdBhIURTFCUpUmBwIxFWwyAxK9tACPQpmMQwXzxe1P2-X8DgAVSEABBKiABUAAkuCEBi+AAYVohiuAAESgmCtyBeDoWRJDxUlRY0IjXddDIEYDFMJ8dXlPU4hxEC3wocDKKgQpsDAa5YDYWjeP46svU3Xk4LlQVENFCTUJlTxEBCIwz01MRbDsFFlWMEiUwJciINYfTDOM0z+OsddLJ5QEhgQaw7D8XRfEMVsDCfAIL2sU9ZlS+VRVPZxrBidTZzInScjCoy2AAJS4XABAANS4ATa2s4TEoWCMpjk1L-TbQxHBRHtys0udgt0mrjKogAFXjuLaizoI6+LgTFUYXMSyxwnksVxTVfCwlMALQO0ijqqUcK2HmxaeJEaKuSs9bXJ67aTzMWYxEKsQ7N8bQzq0qaroM2qOIAGS4Wi6val7602iM8JmfDVmhJx5X0IHJqq0Lrtqu6lrIABFKjaLYvgGIATThuKEbsLCVUcaYr3FJ9LAvH7jDIf1dHsMJL3lBxscqy68bB2aFqJni6twWnYK6pLHBbPRtFVHVFOCWUlPkk8AiCMMHCiMqNj7YHcb0-HJfurgyAEOb2OEDh5aEhKkpsFtdqiVUg0yjDUv2pZVlKtU1RF1IQfFm7CZ4shuIYuq+AAIUYngXc6t2wkVXCxUUyY+ZhCNYUDJwxT+kV8OI8azZxsXLYl26pdjua6pavh+GEPghAAcXT17ErCMQTG89VVbRfCIyWawTBRI2iNsSwrHDoKLZmshDJkbAPDYPuEacOTVklTUrwcNXsu20rJmRPDc7++VLC7ZewLrteN63neno3OmbKG2YUTEf08xdzGHCBePC3NhREV0MdEq6on4XRCvXcKhJVAXAYFASgjADi7xsoPA+UwDwnzPheEYWFDpEVzoVMaptXy10QWvWgqD0GYLJI9GKq14a4OWFhJ8XZDyhBcGqCMACUa6lyl5TKmUl7V1oaLehVsLTHFoHARQoUwBFFqB4bAH4-z5EKLmGkE05HTQUTIJRKjqrqM0dolkuY2SVi6CtQSGcNr7yVAQ4+gpiEX39FhFC0D-CLy8sqeBkckFGUUS0CxaiNEkC0To00o5zSWknNaCqEdV6mPMbAVRekrFxJscuOxFYCAcnYc4-uGJTCBkjPhGwu5UYXiIkYUuSVMoKkiAqUJmSJaROUTk6qlAZAQGHP+akwEa7GNBsgsxUSBmhSGSMpcZZimrkceUta9YzzXifLskBikojoR8ZqEw0w+YohsC4Z8MjSIZJflkuZuSyCLNGXo8ZNpZF3Pkb02Z-SnkvOWS6FoJTvif1igrN2bjD6EK8YEC8D9LAmCWB5BegjAY3MCs-b5Mzsn-OGcOM044rTTg+bcle9yfm4sGfiwFK53TrOet-RWkQjCfX1vKS8o9z7jEvM2XKfDJT+B+vYbpFKcWPOqiQQycgii6MpPokohjJlfJMZSiVoUpXXBlbY10aycFdTPDMCw-9oRhF2hzD6d8eb2EmCA7yhF0U0LJVi1V4q-mSulbKrMbyDETM+eS7FETfnRL0pq7VRTdX0rYYyiFriAHuKPoeWF3K3oe2hPrTsCYH6isDbAPpIayBhq9ewQlFoJxThnEYlV0yg1Uo1Z6nVwK9VOM2bgllNTDx1M5Y0y1KJkSODPNMBwNgukYvOmEtewb5l6QAI6UDAPOneLbOEGoWN9E1uzzUXnZUqNWOpUrmHRDm11tb1WzvnYu6NX9Y3DDXca28prh3DqaXhbCTgQEAO8jCEYx6a15qnU8udC6wA720BsldCVDXrofZu59H1SrT12tqJKIDHBWETGO82YrT3utCkBy9BhwNMshSEBNMLT5wstUEMg4QVS7lPLeMwGGnWYoQSe-9da8lJJIGwDQsBAIGTIKgC4BkSAAApCUAEo2DpIDex-N0717cf1ZC+N0LPEUZTd1MIPNFgLyIm2YIV5f1RwiYwggaCMFSogEuojN6JjxqsLeQByFtkGAvFCtsypnNmpASZ8JebzOWcwZAD+dnXYbW4TRkIx8BG+OEXoQOoQVTHlKibDSyq5PVVmVq-oEUzJkBbgIJqjtRDLuIxtPQsoB3RYM8sFwP0QmYbodNHLcg8v1Uai1W2RWSuCDK+FlxrkqvbQXkPZUeEVSKW8ra-zkTcsAjzW-beKngQgMVG0hwqUjbQK224Ub+sanKjDCqWM6XZMuuy8cBbqg81ZBeOSH1iq-XOrY1duQN2CB3YgC8IF9jSlrhjRF4YyweaZUFGqd9D9bBNh+iXD9LLMoMbm21vLQmftklLSkitpLWMTtR4t9Hv26UONWyD7mhg7KQ86XzarkQTB8wWElbUuph0o+u+1wnRa5U5me7j8dq8Ce3cLQ2iNTao3lfs+qCn4OjbQhpzD0beVT6BI5ZlWE7OPuc+F9zxJY4y3EsrZly7oUhdfZF1q4tf2QWA+vcDhsoPKcQ-l1EWn20bD9WFafRSdg8JYma1M03HO0eoFoMoDRtmgdDYQOt7CoJttESvHCUbp8TCBC26eJYhgfpzaJAwQc2ATKMRYhTLiPFzKDf7gKeyyFJLSiOeMRYpHLCmFCCrtv52q1ZdCnngvhIPxgFoBgHnCq8z86w-Q3vBBsD98H8PsX-2ylR-7rqLCbZT67TVvyxE7mPq7iwh2fw6aXD31z2kfP0-Z9D8x9xg3qSSUXbez38-ffaAD+vwvm3DK7fR9X4GEBQsW+egO+EYxgdgLYXYSUXMiw8Cb+c+cglAhe-4-GQE4+c4cBQ+CB2AZOcoBcNGwofCKED6RcAcywMIyoGaUosB7+GAWBt0dExerE7EZefEOBQY14BBx8koxBH0o0swxsLeGIDksQ6kBAcgEAcA6gF2y+9YAAtCELKLIYihYCoaoSoQdKEtQHQIwMwKwDIT-HZGJA5ChFJM5OMBEEPMKNvreMKEbMLAHk8HsDkPoV1G2MKDRkRP4L4GqH9GYQiIdiKK3g0rqGYLAY6M4T-lXpqGCLCCMA-L4LqLuBGIeNPFYH9HzLlCeBrg4QOEOMsi4QlJjEPNqE+IeA-E+PKCQhAsqLtDeOqDYHoP5gUcCJMLKLqEPNApMH9AsPRmpCxgLthvAJEXvA3sNnDu0mqHhPnIiHNgosts0W9FtDyt5IqNqBXAqHPMsJ3sbk-gFighZswlglAAsYlHzEYOkYiBKJlMdsIiKGJP4GIvrAqMxhlv6ibnsQBhEeCvbk+BApeHtr5CMIKCQmeLMDCAsEjm4VjDke8ZOpxuvLEvEl8RwhVogP4IqHtqYEENqKiFpiEN5MiH5B2MOoev5DCbsXCWes8jSsiRUvWH5NGGYF5DqMApqPCsOp7NwltnYFMMZuSROg8rhqGqLsccMTZAyYEEySzqybvo3gAgfKEAeD7lPPYf0RPvJp8XhhemACccOnJPUgCeqECaMd1K+pELySiDycfLMWqkKUpmOCcblFGOYEeJlGKDCKeE0lMC2AsMEGeGEL4M4DacgkFocZACcaKLeLptcQ+oKgvMInuHRqYGAXhEsLqJrp9kMd8dHv6LKOEBtmkZMNME6aEBmdrubvMWKV1AbLMKiDCJMFvtqLKNCFhPYBvl5MNPoNYGWSHhjnoVWQlJJDzKfIsJCA-JfCaQVNhKlIiFMMagqI6q8a9vjsHlziKScZlBAmqGYNDmEBjM2S4NfJckGMdtcmqS1u9pmfaScCcTWV5KKPWeIgzLKOai2BvhqKOczi8Y-iuVriHmHgwBoo6aCP-peD9KVP6Cys2cqD6YYByo1hKGfhftgCcbmR9HzP1NwqEDUZKKVEha-jQbSa2orCNo3leFhElN4alOmtAn0UuXjqvFPjPpQEQIgQPtPgwJ8OGQOcCGNkqOOYYNCJAtMKATpn9KvrtPoA0fhZfqgGxQXpxUBBACcXxRqMlqzsJUsToLuOcYvLEWKOqBqNQfAYgRGdqJYWYFtoEOlPoIro3sOoqIIksDeEjtQvRedBgbQYgeUAwGkOfv2dmVEblMOUENZeZX7LwTpptD5BiC4NccZZgd5Z+AwIghGYvKyuKMlJMEIf7DMAuRYIsHzCMOKAlV5TPjIKgB4NcAXmlXDp0Q0kzC6SaQxozD9OYM0rnERKVVgUTnFKgGkGZQGJqJlHRjZW7o3oYNPCEP8frFttMHRY-oShucATRgAkRB0v-A-JPH9DRnzELE4KsNArAR9mcDgDqTxdpQqDRoeHMCNTCNYCQUPJMKQoiJnhqGNLEEAA */
    // tsTypes: {} as import("./basket.machine.typegen").Typegen0,
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
      // @ts-ignore
      updateBasket: assign({
        basket: (_context: BasketContext, { data }: BasketEvent) =>
          parseBasket(data),
        error: ({ error }: BasketContext, { data }: BasketEvent) => {
          error ??= {}; // safety check
          set(error, "provisioningErrors", get(data, "provisioningErrors"));
          return error;
        },
        products: (_context: BasketContext, { data }: BasketEvent) => {
          const basket = parseBasket(data);
          const products = get(basket, "products", []);
          const provisioningErrors = get(data, "provisioningErrors");
          return map(products, product =>
            parseBasketProduct(product, provisioningErrors)
          );
        },
        summary: (_context: BasketContext, { data }: BasketEvent) => {
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
        paymentDetails: (_context: BasketContext, { data }: BasketEvent) =>
          data,
      }),

      // @ts-ignore
      setInvoice: assign({
        invoice: (_context: BasketContext, { data }: BasketEvent) => data,
        basket: undefined,
        summary: undefined,
        items: ({ items }: BasketContext, _event) => {
          forEach(items, (actor: ActorRef<any, any>) => {
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

      // @ts-ignore
      setPayment: assign({
        payment: (_context: BasketContext, { data }: BasketEvent) => data,
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
        actors: ({ actors, basket }) => {
          // only spawn if we have not already spawned
          actors.billingDetails ??= spawnBillingDetails(basket);
          actors.currency ??= spawnCurrency(basket);
          actors.customFields ??= spawnCustomFields(basket);
          actors.paymentDetails ??= spawnPaymentDetails(basket);
          actors.promotions ??= spawnPromotions(basket);

          return actors;
        },
      }),

      // @ts-ignore
      refreshActors: pure(({ basket, actors }) => {
        forEach(actors, (actor: ActorRef<any, any>) => {
          if (actor?.send && !actor.getSnapshot()?.done) {
            actor.send({ type: "REFRESH", data: basket });
          }
        });
      }),

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
        items: ({ items, basket }, { data }) => {
          const machine = spawnProductConfiguration(data, basket);

          items.push(machine);
          return items;
        },
      }),

      // @ts-ignore
      refreshItems: assign({
        items: ({ basket, items }: any) => {
          const newItems: ActorRef<any, any>[] = [];

          forEach(items, actor => {
            if (!actor?.state?.done) {
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
        items: ({ items }, _event) => {
          forEach(items, item => {
            if (item?.send && !item?.state?.done) {
              item.send({ type: "REMOVE" });
            }
          });
          return [];
        },
      }),

      // ---

      abortController: assign({
        controller: ({ controller }) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return new AbortController();
        },
      }),

      // ---
      setFeedbackSuccess: (_context: BasketContext, _event: BasketEvent) => {
        addSuccess("Successfully updated the basket");
      },

      setFeedbackError: ({ error }, _event) => {
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

      // @ts-ignore
      setError: assign({
        error: (context, { data }: BasketEvent) => data?.error,
      }),

      clearError: assign({ error: undefined }),
    },

    guards: {
      hasNoBasket: ({ basket }) => isEmpty(basket),

      hasNewBasket: ({ basket }, { data }) =>
        !isEmpty(data) && !isEqual(basket, data),

      // --- Actor Guards
      currencyComplete: ({ actors }) => {
        return actors.currency?.state?.matches("complete");
      },

      currencyConfiguring: ({ actors }) => {
        return !actors.currency?.state?.matches("complete");
      },

      promotionsComplete: ({ actors }) => {
        // promotions should not hold up the process of checking out
        // unless it is in the process of being updated or loading
        return !["processing", "loading"].some(
          actors.promotions?.state?.matches
        );
      },

      promotionsConfiguring: ({ actors }) => {
        return ["processing", "loading"].some(
          actors.promotions?.state?.matches
        );
      },

      customFieldsComplete: ({ actors }) => {
        return actors.customFields?.state?.matches("complete");
      },

      customFieldsConfiguring: ({ actors }) => {
        return !actors.customFields?.state?.matches("complete");
      },

      billingComplete: ({ actors }) => {
        return actors.billingDetails?.state?.matches("complete");
      },

      billingConfiguring: ({ actors }) => {
        return !actors.billingDetails?.state?.matches("complete");
      },

      paymentDetailsValid: ({ actors }) => {
        return (
          actors.paymentDetails?.state?.done ||
          actors.paymentDetails?.state?.matches("available.valid")
        );
      },

      paymentDetailsComplete: ({ actors }, { data }) => {
        const value =
          (actors.paymentDetails?.state?.done ||
            actors.paymentDetails?.state?.matches("complete")) &&
          !isEmpty(data);

        return value;
      },

      hasPaymentDetails: ({ paymentDetails }) => {
        const value = !isNil(paymentDetails) && !isEmpty(paymentDetails);

        return value;
      },

      paymentDetailsConfiguring: ({ actors, paymentDetails }) => {
        return (
          isEmpty(paymentDetails) &&
          ["available.invalid", "available.checking", "available.loading"].some(
            actors.paymentDetails?.state?.matches
          )
        );
      },

      paymentNeeded: ({ paymentDetails }) => {
        const hasOustandingBalance = paymentDetails?.amount > 0;

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
          actor => !["subscribing", "loading"].some(actor?.state.matches)
        );
      },

      hasNoProducts: ({ products }) => isEmpty(products),
      hasProducts: ({ products }) => !isEmpty(products),
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
      poll: () => useTime().POLL,
    },

    // @ts-ignore
    services,
  }
);
