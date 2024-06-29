// --- external
import { createMachine, assign, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import paymentMachine from "../payment/payment.machine";

import { useFeedback } from "../feedback";
const { addError, addSuccess, trackEvent } = useFeedback();

// --- utils
import { useTime, useValidationParser } from "../../utils";
import {
  useSummaryParser,
  spawnConfiguration,
  spawnBillingDetails,
  spawnCurrency,
  spawnCustomFields,
  spawnPaymentDetails,
  spawnPromotions,
} from "./utils";

import {
  differenceBy,
  every,
  find,
  findIndex,
  forEach,
  get,
  includes,
  isEmpty,
  omit,
  remove,
  some,
  trimStart,
  uniqueId,
} from "lodash-es";

// --- types
import type { BasketContext, BasketEvent } from "./types.d";
import { responseCodes } from "../api";

import { PaymentTypes } from "../paymentDetails/types.d";
import { GatewayTypes } from "../paymentDetails/gateways/types.d";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCMCGsDWYAuBZVAdqjAE4B0sArsrAMYkCWyDBUAxAMoCiHHAkgHkAcgG0ADAF1EoAA4B7WA2wM5BaSAAeiAEwB2XQGYyATgMGxYgGwBGAKy6ALGIO6ANCACeic9qPGxABxi1rrWDuZixpYAvtHuaJg4+ESkZAA2cqgQLOwQqmBkLABuclhkCVh4hMRg5BlZOQjFcrSoyqriEp3q8ortakiaiLba7l4IBtYG2mTONsbaDgFRAXax8eiVyTV1mdmsbLUkcuQyaW0AZicAtuWbSdWp9ftQTQQlrf2d3YO9SioDUBaCZTBwmIJRFy2Bz2fRjHTGfxkSwjMJmawWALrEAVB4pWpkWjnBjXHJsPIEArNMq4qr48hE1AkxrNT4A76SHoKf6qdTAxYOMGWSzaazGAIGEXhMLwhDaSwBMgBXSRYy2AKWMy2WwGWzY2nbVKM5kHI4nMhnS43O6JOk7QnE0msN4fNrsyQ-WTc-p8nS6cVkPQ6jEhUJ2WW+CWzCWC+xS9W6fX3O2pGCUkhug4UqnvUoFA2PAlp2qZ16st0dD2c37egG+hAjWWrMjTbQLTULXTzAxJ22GotgdOlw4kY6nc7YK4kW4F+lkYsZ5TO8tfKtSGt9OuDfkBeyB4UGDVTbTaWzGWXWAJg8K2ZyIqx6BxhXtbQvkWAACzkMhkZOzFGwNp82Tft3y-H8ck9EA-h9bcdBhIURTFCUpUmBwIxFWwyAxK9tACPQpmMQwXzxe1P2-X8DgAVSEABBKiABUAAkuCEBi+AAYVohiuAAESgmCtyBeDoWRJDxUlRY0IjXddDIEYDFMJ8dXlPU4hxEC3wocDKKgQpsDAa5YDYWjeP46svU3Xk4LlQVENFCTUJlTxEBCIwz01MRbDsFFlWMEiUwJciINYfTDOM0z+OsddLJ5QEhgQaw7D8XRfEMVsDCfAIL2sU9ZlS+VRVPZxrBidTZzInScjCoy2AAJS4XABAANS4ATa2s4TEoWCMpjk1L-TbQxHBRHtys0udgt0mrjKogAFXjuLaizoI6+LgTFUYXMSyxwnksVxTVfCwlMALQO0ijqqUcK2HmxaeJEaKuSs9bXJ67aTzMWYxEKsQ7N8bQzq0qaroM2qOIAGS4Wi6val7602iM8JmfDVmhJx5X0IHJqq0Lrtqu6lrIABFKjaLYvgGIATThuKEbsLCVUcaYr3FJ9LAvH7jDIf1dHsMJL3lBxscqy68bB2aFqJni6twWnYK6pLHBbPRtFVHVFOCWUlPkk8AiCMMHCiMqNj7YHcb0-HJfurgyAEOb2OEDh5aEhKkpsFtdqiVUg0yjDUv2pZVlKtU1RF1IQfFm7CZ4shuIYuq+AAIUYngXc6t2wkVXCxUUyY+ZhCNYUDJwxT+kV8OI8azZxsXLYl26pdjua6pavh+GEPghAAcXT17ErCMQTG89VVbRfCIyWawTBRI2iNsSwrHDoKLZmshDJkbAPDYPuEacOTVklTUrwcNXsu20rJmRPDc7++VLC7ZewLrteN63neno3OmbKG2YUTEf08xdzGHCBePC3NhREV0MdEq6on4XRCvXcKhJVAXAYFASgjADi7xsoPA+UwDwnzPheEYWFDpEVzoVMaptXy10QWvWgqD0GYLJI9GKq14a4OWFhJ8XZDyhBcGqCMACUa6lyl5TKmUl7V1oaLehVsLTHFoHARQoUwBFFqB4bAH4-z5EKLmGkE05HTQUTIJRKjqrqM0dolkuY2SVi6CtQSGcNr7yVAQ4+gpiEX39FhFC0D-CLy8sqeBkckFGUUS0CxaiNEkC0To00o5zSWknNaCqEdV6mPMbAVRekrFxJscuOxFYCAcnYc4-uGJTCBkjPhGwu5UYXiIkYUuSVMoKkiAqUJmSJaROUTk6qlAZAQGHP+akwEa7GNBsgsxUSBmhSGSMpcZZimrkceUta9YzzXifLskBikojoR8ZqEw0w+YohsC4Z8MjSIZJflkuZuSyCLNGXo8ZNpZF3Pkb02Z-SnkvOWS6FoJTvif1igrN2bjD6EK8YEC8D9LAmCWB5BegjAY3MCs-b5Mzsn-OGcOM044rTTg+bcle9yfm4sGfiwFK53TrOet-RWkQjCfX1vKS8o9z7jEvM2XKfDJT+B+vYbpFKcWPOqiQQycgii6MpPokohjJlfJMZSiVoUpXXBlbY10aycFdTPDMCw-9oRhF2hzD6d8eb2EmCA7yhF0U0LJVi1V4q-mSulbKrMbyDETM+eS7FETfnRL0pq7VRTdX0rYYyiFriAHuKPoeWF3K3oe2hPrTsCYH6isDbAPpIayBhq9ewQlFoJxThnEYlV0yg1Uo1Z6nVwK9VOM2bgllNTDx1M5Y0y1KJkSODPNMBwNgukYvOmEtewb5l6QAI6UDAPOneLbOEGoWN9E1uzzUXnZUqNWOpUrmHRDm11tb1WzvnYu6NX9Y3DDXca28prh3DqaXhbCTgQEAO8jCEYx6a15qnU8udC6wA720BsldCVDXrofZu59H1SrT12tqJKIDHBWETGO82YrT3utCkBy9BhwNMshSEBNMLT5wstUEMg4QVS7lPLeMwGGnWYoQSe-9da8lJJIGwDQsBAIGTIKgC4BkSAAApCUAEo2DpIDex-N0717cf1ZC+N0LPEUZTd1MIPNFgLyIm2YIV5f1RwiYwggaCMFSogEuojN6JjxqsLeQByFtkGAvFCtsypnNmpASZ8JebzOWcwZAD+dnXYbW4TRkIx8BG+OEXoQOoQVTHlKibDSyq5PVVmVq-oEUzJkBbgIJqjtRDLuIxtPQsoB3RYM8sFwP0QmYbodNHLcg8v1Uai1W2RWSuCDK+FlxrkqvbQXkPZUeEVSKW8ra-zkTcsAjzW-beKngQgMVG0hwqUjbQK224Ub+sanKjDCqWM6XZMuuy8cBbqg81ZBeOSH1iq-XOrY1duQN2CB3YgC8IF9jSlrhjRF4YyweaZUFGqd9D9bBNh+iXD9LLMoMbm21vLQmftklLSkitpLWMTtR4t9Hv26UONWyD7mhg7KQ86XzarkQTB8wWElbUuph0o+u+1wnRa5U5me7j8dq8Ce3cLQ2iNTao3lfs+qCn4OjbQhpzD0beVT6BI5ZlWE7OPuc+F9zxJY4y3EsrZly7oUhdfZF1q4tf2QWA+vcDhsoPKcQ-l1EWn20bD9WFafRSdg8JYma1M03HO0eoFoMoDRtmgdDYQOt7CoJttESvHCUbp8TCBC26eJYhgfpzaJAwQc2ATKMRYhTLiPFzKDf7gKeyyFJLSiOeMRYpHLCmFCCrtv52q1ZdCnngvhIPxgFoBgHnCq8z86w-Q3vBBsD98H8PsX-2ylR-7rqLCbZT67TVvyxE7mPq7iwh2fw6aXD31z2kfP0-Z9D8x9xg3qSSUXbez38-ffaAD+vwvm3DK7fR9X4GEBQsW+egO+EYxgdgLYXYSUXMiw8Cb+c+cglAhe-4-GQE4+c4cBQ+CB2AZOcoBcNGwofCKED6RcAcywMIyoGaUosB7+GAWBt0dExerE7EZefEOBQY14BBx8koxBH0o0swxsLeGIDksQ6kBAcgEAcA6gF2y+9YAAtCELKLIYihYCoaoSoQdKEtQHQIwMwKwDIT-HZGJA5ChFJM5OMBEEPMKNvreMKEbMLAHk8HsDkPoV1G2MKDRkRP4L4GqH9GYQiIdiKK3g0rqGYLAY6M4T-lXpqGCLCCMA-L4LqLuBGIeNPFYH9HzLlCeBrg4QOEOMsi4QlJjEPNqE+IeA-E+PKCQhAsqLtDeOqDYHoP5gUcCJMLKLqEPNApMH9AsPRmpCxgLthvAJEXvA3sNnDu0mqHhPnIiHNgosts0W9FtDyt5IqNqBXAqHPMsJ3sbk-gFighZswlglAAsYlHzEYOkYiBKJlMdsIiKGJP4GIvrAqMxhlv6ibnsQBhEeCvbk+BApeHtr5CMIKCQmeLMDCAsEjm4VjDke8ZOpxuvLEvEl8RwhVogP4IqHtqYEENqKiFpiEN5MiH5B2MOoev5DCbsXCWes8jSsiRUvWH5NGGYF5DqMApqPCsOp7NwltnYFMMZuSROg8rhqGqLsccMTZAyYEEySzqybvo3gAgfKEAeD7lPPYf0RPvJp8XhhemACccOnJPUgCeqECaMd1K+pELySiDycfLMWqkKUpmOCcblFGOYEeJlGKDCKeE0lMC2AsMEGeGEL4M4DacgkFocZACcaKLeLptcQ+oKgvMInuHRqYGAXhEsLqJrp9kMd8dHv6LKOEBtmkZMNME6aEBmdrubvMWKV1AbLMKiDCJMFvtqLKNCFhPYBvl5MNPoNYGWSHhjnoVWQlJJDzKfIsJCA-JfCaQVNhKlIiFMMagqI6q8a9vjsHlziKScZlBAmqGYNDmEBjM2S4NfJckGMdtcmqS1u9pmfaScCcTWV5KKPWeIgzLKOai2BvhqKOczi8Y-iuVriHmHgwBoo6aCP-peD9KVP6Cys2cqD6YYByo1hKGfhftgCcbmR9HzP1NwqEDUZKKVEha-jQbSa2orCNo3leFhElN4alOmtAn0UuXjqvFPjPpQEQIgQPtPgwJ8OGQOcCGNkqOOYYNCJAtMKATpn9KvrtPoA0fhZfqgGxQXpxUBBACcXxRqMlqzsJUsToLuOcYvLEWKOqBqNQfAYgRGdqJYWYFtoEOlPoIro3sOoqIIksDeEjtQvRedBgbQYgeUAwGkOfv2dmVEblMOUENZeZX7LwTpptD5BiC4NccZZgd5Z+AwIghGYvKyuKMlJMEIf7DMAuRYIsHzCMOKAlV5TPjIKgB4NcAXmlXDp0Q0kzC6SaQxozD9OYM0rnERKVVgUTnFKgGkGZQGJqJlHRjZW7o3oYNPCEP8frFttMHRY-oShucATRgAkRB0v-A-JPH9DRnzELE4KsNArAR9mcDgDqTxdpQqDRoeHMCNTCNYCQUPJMKQoiJnhqGNLEEAA */
    tsTypes: {} as import("./basket.machine.typegen").Typegen0,
    id: "basketManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      basket: undefined,
      invoice: undefined,
      // ---
      items: [],
      bin: [],
      // ---
      actors: {
        billing_details: undefined,
        currency: undefined,
        custom_fields: undefined,
        payment_details: undefined,
        promotions: undefined,
      },

      // ---
      // the generated summary of ALL the items,
      // including the totals formatted for display
      summary: undefined,
      // ---
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
            invoke: {
              src: "load",
              onDone: {
                target: "actors",
                actions: ["setBasket", "loadItems"],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
          actors: {
            entry: ["spawnActors"],
            always: {
              target: "#shopping",
              cond: "isNotLoading",
            },
          },
        },
      },

      // if we have a session, we can now claim any existing basket
      claiming: {
        id: "claiming",
        invoke: {
          src: "claim",
          onDone: {
            target: "#shopping",
            actions: ["refreshActors"],
          },
          onError: {
            target: "#error",
            actions: ["setError", "setFeedbackError"],
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
            actions: ["setBasket", "refreshActors"],
          },
          onError: { target: "#error" },
        },
      },

      // We are now ready to start accepting items into the basket
      // items are effectively products that are not yet added to the basket OR products that are being changed
      // regardles, these items require configuring
      // once items are configured(complete), we can then add them (back) into the basket,
      // NB: this allows us to have multiple products added at once and have a mixed basket
      // once successfully added, they become products and can be updated/removed
      shopping: {
        id: "shopping",
        type: "parallel",
        states: {
          // after we do any operation that requires a refresh, we will refresh the basket and then refresh the actors
          refreshing: {
            initial: "complete",
            states: {
              processing: {
                id: "refreshing",
                invoke: {
                  src: "refresh",
                  onDone: {
                    target: ["complete", "#shopping.items"],
                    actions: ["updateBasket", "refreshActors"],
                  },
                  onError: { target: "#error" },
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
              complete: {
                type: "final",
              },
            },
            on: {
              AUTHENTICATED: { target: "#claiming" },
            },
          },

          items: {
            initial: "configuring",
            states: {
              empty: {
                always: [
                  { target: "configuring", cond: "someConfiguring" },
                  { target: "complete", cond: "itemsConfigured" },
                ],
              },

              configuring: {
                id: "configuring",
                always: [
                  { target: "empty", cond: "hasNoItems" },
                  { target: "complete", cond: "itemsConfigured" },
                ],
              },

              processing: {
                initial: "everything",
                states: {
                  everything: {
                    entry: ["muteBasket", "updateActors"],

                    invoke: {
                      src: "update",
                      onDone: {
                        target: "#processed",
                        actions: ["refreshItems", "updateBasket"],
                      },
                      onError: {
                        target: "#processed",
                        actions: [
                          "refreshItems",
                          "updateBasket",
                          "setError",
                          "setFeedbackError",
                        ],
                      },
                    },
                  },

                  updating: {
                    id: "updating",
                    invoke: {
                      src: "updateItem",
                      onDone: {
                        target: "error",
                        actions: ["refreshItems", "updateBasket"],
                      },
                      onError: {
                        target: "#processed",
                        actions: [
                          "refreshItems",
                          "updateBasket",
                          "setError",
                          "setFeedbackError",
                        ],
                      },
                    },
                  },

                  removing: {
                    id: "removing",
                    invoke: {
                      src: "removeItem",
                      onDone: {
                        target: "#processed",
                        actions: ["removeItem", "updateBasket"],
                      },
                      onError: {
                        target: "#processed",
                        actions: [
                          "refreshItems",
                          "updateBasket",
                          "setError",
                          "setFeedbackError",
                        ],
                      },
                    },
                  },

                  error: {
                    after: {
                      error: "#processed",
                    },
                  },
                },
              },

              processed: {
                id: "processed",
                after: {
                  wait: "#refreshing",
                },
              },

              // items are 'complete' only when they have been successfully added to the basket
              complete: {
                always: [
                  { target: "empty", cond: "hasNoItems" },
                  { target: "configuring", cond: "someConfiguring" },
                ],
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

              // items are 'complete' only when they have been successfully added to the basket
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

              // items are 'complete' only when they have been successfully added to the basket
              complete: {
                always: [
                  { target: "configuring", cond: "promotionsConfiguring" },
                ],
                type: "final",
              },
            },
          },

          custom_fields: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "custom_fieldsComplete" },
              },

              // items are 'complete' only when they have been successfully added to the basket
              complete: {
                always: [
                  { target: "configuring", cond: "custom_fieldsConfiguring" },
                ],
                type: "final",
              },
            },
          },

          billing_details: {
            initial: "configuring",
            states: {
              configuring: {
                always: { target: "complete", cond: "billingComplete" },
              },

              // items are 'complete' only when they have been successfully added to the basket
              complete: {
                always: [{ target: "configuring", cond: "billingConfiguring" }],
                type: "final",
              },
            },
          },

          // ---
        },
        onDone: "checkout",
      },

      // We are now ready to accept payment as all the shopping items are complete
      // We will accept the checkout event and forward it to the payment_details machine
      // Which in turn will forward it to the payment_gateway machine
      // The payment_gateway machine will then run its process and when complete will return the Payload back to the payment_details machine
      // The payment_details machine will then Parse and return that to the processing state
      // This will trigger the Convert service, which will then process the order
      // The processing state will then run its process and when complete will return the completed order
      checkout: {
        id: "checkout",
        initial: "configuring",
        states: {
          configuring: {
            always: [{ target: "available", cond: "paymentDetailsValid" }],
          },

          // items are 'complete' only when they have been successfully added to the basket
          available: {
            always: [{ target: "configuring", cond: "paymentConfiguring" }],
            // ---
            // NB: Checkout is a chained sequence of events:
            // First, it will forward the event to the payment_details machine
            // The payment_details machine will then forward that to the payment_gateway sub machine
            // The payment_gateway machine will then run its process and when complete will return the Payload back to the payment_details machine
            // The payment_details machine will then Parse and return that to the processing state
            // The processing state will then run its process and when complete will return the completed order
            on: {
              CHECKOUT: {
                target: "processing",
                actions: "checkoutActors",
              },
            },
          },

          processing: {
            on: {
              // response from the payment_details machine = we are ready to convert
              PAYMENT_DETAILS: {
                target: "#converting",
                actions: "setPaymentDetails",
                cond: "paymentDetailsComplete",
              },
            },
          },
        },
      },

      converting: {
        id: "converting",
        invoke: {
          src: "convert",
          onDone: [
            {
              target: "#paying",
              actions: "setInvoice",
              cond: "needsPayment",
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

      // Payment machine is invoked directly as we are serializing the payment process
      // we wont leave this node until the payment is complete, or we cancel
      paying: {
        id: "paying",
        invoke: {
          id: "payment",
          src: paymentMachine,
          data: ({ basket, paymentDetails }: BasketContext) => ({
            order: basket,
            paymentDetails,
          }),
          onDone: {
            target: "#complete",
            actions: ["setPayment"],
          },
          onError: {
            actions: ["setError", "setFeedbackError"],
          },
        },
        on: {
          CANCEL: {
            target: "#checkout",
          },
        },
      },

      // TODO: actual payment node.

      // Handle errors
      error: {
        id: "error",
      },

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
      REMOVE: {
        target: "#shopping.items.processing.removing",
        actions: ["binItem"],
      },
      UPDATE: [
        {
          target: "#shopping.items.processing.everything",
          actions: ["updateItems", "clearBin"],
          cond: "hasNoItem",
        }, // update everything
        {
          actions: ["updateItem"],
          target: "#shopping.items.processing.updating",
        },
      ],
      CLEAR: {
        target: "#shopping.items.processing",
        actions: ["removeAllItems"],
      },
      // ---
      "UPDATE.QUANTITY": { actions: ["sendToItem"] },
      "UPDATE.TERM": { actions: ["sendToItem"] },
      "UPDATE.OPTIONS": { actions: ["sendToItem"] },
      "UPDATE.ATTRIBUTES": { actions: ["sendToItem"] },
      "UPDATE.PROVISIONING": { actions: ["sendToItem"] },

      // This transition will match any event, but we will target the completion of ANY spawned machine
      // "*": {
      //   actions: ["removeItem"],
      //   cond: (_context, event) => includes(event.type, "done.invoke")
      // }

      REFRESH: {
        target: "#refreshing",
        actions: "muteBasket",
        cond: "isNotMuted",
      },

      UNAUTHENTICATED: {
        target: "#loading",
        actions: ["clearError", "clearBasket", "removeAllItems", "clearBin"],
      },
    },
  },
  {
    actions: {
      setBasket: assign({
        basket: (_context: BasketContext, { data }: BasketEvent) => data,
        summary: (_context: BasketContext, { data }: BasketEvent) =>
          useSummaryParser(data),
        error: undefined,
      }),

      updateBasket: assign({
        basket: ({ basket }: BasketContext, { data }: BasketEvent) =>
          get(data, "basket", basket),
        summary: ({ basket }: BasketContext, { data }: BasketEvent) =>
          useSummaryParser(get(data, "basket", basket)),
        error: undefined,
        muted: false,
      }),

      muteBasket: assign({
        muted: true,
      }),

      clearBasket: assign({
        basket: undefined,
        summary: useSummaryParser(),
        error: undefined,
      }),

      setPaymentDetails: assign({
        paymentDetails: (_context: BasketContext, { data }: BasketEvent) =>
          data,
      }),

      setPayment: assign({
        payment: (_context: BasketContext, { data }: BasketEvent) => data,
      }),

      setInvoice: assign({
        invoice: (_context: BasketContext, { data }: BasketEvent) => data,
        basket: undefined,
        bin: [],
        summary: undefined,
        items: ({ items }, _event) => {
          forEach(items, actor => {
            if (!actor?.state?.done && actor?.stop) actor.stop();
          });
          return [];
        },
        actors: ({ actors }) => {
          forEach(actors, actor => {
            if (!actor?.state?.done && actor?.stop) actor.stop();
          });
          return {
            billing_details: undefined,
            currency: undefined,
            custom_fields: undefined,
            payment_details: undefined,
            promotions: undefined,
          };
        },
        error: undefined,
      }),

      // --- Spawned Actors Actions
      spawnActors: assign({
        actors: ({ actors, basket }) => {
          // only spawn if we have not already spawned
          actors.billing_details ??= spawnBillingDetails(basket);
          actors.currency ??= spawnCurrency(basket);
          actors.custom_fields ??= spawnCustomFields(basket);
          actors.payment_details ??= spawnPaymentDetails(basket);
          actors.promotions ??= spawnPromotions(basket);

          return actors;
        },
      }),

      refreshActors: pure(({ basket, actors, items }) => {
        forEach(actors, actor => {
          if (actor?.send && !actor?.state?.done) {
            actor.send({ type: "REFRESH", data: basket });
          }
        });

        forEach(items, item => {
          const product =
            find(basket?.products, ["id", item?.id]) ||
            item.state.context.values;
          item.send({
            type: "REFRESH",
            data: {
              product,
              currency_id: basket?.currency_id,
              promotions: basket?.promotions || [],
            },
          });
        });
      }),

      updateActors: pure(({ actors }) => {
        forEach(actors, actor => {
          if (actor?.send) {
            actor.send({ type: "UPDATE" });
          }
        });
      }),

      checkoutActors: pure(({ actors }) => {
        // for Now  only the payment details is affected by checkout
        actors?.payment_details?.send({ type: "CHECKOUT" });
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
              product.id,
              product,
              basket?.currency_id,
              promotions
            );
            items.push(machine);
          });
          return items;
        },
        error: undefined,
      }),

      addItem: assign({
        items: ({ items, basket }, { data }) => {
          const machine = spawnConfiguration(
            data?.id || uniqueId("item_"),
            omit(data, "id"),
            basket?.currency_id,
            basket?.promotions
          );

          items.push(machine);
          return items;
        },
        error: undefined,
      }),

      updateItem: pure(({ items }, { data }) => {
        const itemId = data?.itemId;
        const item = find(items, ["id", itemId]);
        item.send({ type: "PROCESSING" });
      }),

      updateItems: pure(({ items }, { data }) => {
        forEach(items, item => {
          if (item.state.matches("configured")) {
            item.send({ type: "PROCESSING" });
          }
        });
      }),

      binItem: assign({
        bin: ({ basket, items, bin }, { data }) => {
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = find(items, ["id", itemId]);
          if (removed) bin.push(removed);
          removed.send({ type: "BIN" });

          trackEvent({ ecommerce: null });
          trackEvent({
            event: "remove_from_cart",
            ecommerce: {
              currency: basket?.currency?.code,
              value: removed?.state?.context?.summary.total,
              items: [
                {
                  item_id: removed?.state?.context?.config.product_id,
                  item_name: removed?.state?.context?.available.product.name, // For reporting purposes we intentionally pass untranslated product name
                  item_category:
                    removed?.state?.context?.available.product.category.name, // For reporting purposes we intentionally pass untranslated category name
                  quantity: removed?.state?.context?.config.quantity,
                  discount:
                    removed?.state?.context?.available
                      .configuration_net_amount_discount_converted,
                  price: removed?.state?.context?.summary.total,
                },
              ],
            },
          });
          return bin;
        },
        error: undefined,
      }),

      clearBin: assign({
        bin: [],
      }),

      removeAllItems: assign({
        items: ({ items }, _event) => {
          forEach(
            items,
            item => !item?.state?.done && item?.stop && item?.stop()
          );
          return [];
        },
        bin: [],
        error: undefined,
      }),

      removeItem: assign({
        items: ({ items }, { type, data }, _event) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(items, ["id", itemId]);
          removed.forEach(
            item => !item?.state?.done && item?.stop && item?.stop()
          ); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return items;
        },
        bin: ({ bin }, { data }, _event) => {
          // me may be given a name, but if not we can determine it from the event type
          const itemId = data?.itemId || trimStart(type, "invoke.done.");
          const removed = remove(bin, ["id", itemId]);
          removed.forEach(
            item => !item?.state?.done && item?.stop && item?.stop()
          ); // if it exists, be 100% vigilant and stop the referenced machine in case it is still running
          return bin;
        },

        error: undefined,
      }),

      refreshItems: assign({
        items: ({ items, basket }, { data }) => {
          const promotions = data?.basket?.promotions || [];
          const currency_id = data?.basket?.currency_id;
          forEach(data?.items, (item, index) => {
            const itemId = item.id;
            const newId = get(data?.newItems, [index, "id"]);
            const product = find(data?.basket?.products, ["id", itemId]);

            // if not, we need to check if its been Replaced
            if (!product && newId) {
              // Replaced...
              // we need to replace it with a new machine and stop the old one
              // NB: its safe to assume that the items array is in the same order as the newItems
              // so we can use the index to match the items
              if (item && !item?.state?.done) item.stop(); // ensure the machine is stopped
              const currentIndex = findIndex(items, ["id", itemId]);
              const newProduct = find(data?.basket?.products, ["id", newId]);
              if (newProduct) {
                const machine = spawnConfiguration(
                  newId,
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
              product.id,
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
          // const dangling = differenceBy(items, data.newItems, "id");
          // forEach(dangling, item => {
          //   const product = item.state.context.config;
          //   item.send({
          //     type: "REFRESH",
          //     data: { product, currency_id, promotions },
          //   });
          // });

          // ---
          return items;
        },
        bin: [],
        error: undefined,
      }),

      // ---

      sendToItem: sendTo(
        (_context, { data: { itemId } }) => itemId,
        (_context, { type, data }) => ({ type, data })
      ),

      // ---
      setFeedbackSuccess: (_context, _event) => {
        addSuccess("Successfully updated the basket");
      },

      setFeedbackError: ({ error }, _event) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;

        addError({
          title: error?.title || "We experienced an error updating the basket",
          copy: error?.message,
          data: error?.data,
        });
      },

      setError: assign({
        error: (context, { data }) => {
          const { items, newItems } = data;
          let { error } = data;

          console.error("Basket Error", error);

          // if we are supplied a machine, we must forward/send the error to it
          if (items || newItems) {
            forEach(items.concat(newItems), item => {
              const found = find(context.items, ["id", item.id]);
              if (found) {
                found.send({ type: "ERROR", data: { error: data.error } });
              }
            });

            if (error?.code == 422) {
              error.message = "Validation error";
            }
          } else if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          // addError(error?.message);

          return error;
        },
      }),

      clearError: assign({ error: undefined }),
    },

    guards: {
      hasNoBasket: ({ basket }) => isEmpty(basket),

      needsPayment: ({ paymentDetails }) => {
        const hasOustandingBalance = paymentDetails?.amount > 0;

        const payingNow =
          paymentDetails?.payment_type != PaymentTypes.PAY_LATER;

        const manualPayment = includes(
          [GatewayTypes.OFFLINE, GatewayTypes.BANK_TRANSFER],
          paymentDetails?.gateway?.type
        );

        const valid = hasOustandingBalance && payingNow && !manualPayment;

        // NB: original checks from the vue app for reference
        // (data.balance !== 0 && data.payment_type !== PaymentTypes.PAY_LATER) ||
        //   includes(
        //     [
        //       PaymentMethodType.GATEWAY_OFFLINE,
        //       PaymentMethodType.GATEWAY_BANK_TRANSFER,
        //       PaymentTypes.PAY_LATER
        //     ],
        //     paymentMethodType
        //   )) ||
        // this.paymentData.wallet_amount > 0

        return valid;
      },

      isNotMuted: ({ muted }) => !muted,

      // --- Actor Guards
      currencyComplete: ({ actors }) => {
        return actors.currency?.state?.matches("complete");
      },

      currencyConfiguring: ({ actors }) => {
        return !actors.currency?.state?.matches("complete");
      },

      promotionsComplete: ({ actors }) => {
        return actors.promotions?.state?.matches("complete");
      },

      promotionsConfiguring: ({ actors }) => {
        return !actors.promotions?.state?.matches("complete");
      },

      custom_fieldsComplete: ({ actors }) => {
        return actors.custom_fields?.state?.matches("complete");
      },

      custom_fieldsConfiguring: ({ actors }) => {
        return !actors.custom_fields?.state?.matches("complete");
      },

      billingComplete: ({ actors }) => {
        return actors.billing_details?.state?.matches("complete");
      },

      billingConfiguring: ({ actors }) => {
        return !actors.billing_details?.state?.matches("complete");
      },

      paymentDetailsValid: ({ actors }) => {
        return (
          actors.payment_details?.state?.done ||
          actors.payment_details?.state?.matches("available.valid")
        );
      },

      paymentConfiguring: ({ actors }) => {
        return [
          "available.invalid",
          "available.checking",
          "available.loading",
        ].some(actors.payment_details?.state?.matches);
      },

      paymentDetailsComplete: ({ actors }, { data }) => {
        return (
          (actors.payment_details?.state?.done ||
            actors.payment_details?.state?.matches("complete")) &&
          !isEmpty(data)
        );
      },

      // --- Configuration Guards

      itemsConfigured: ({ items }) => {
        const itemsConfigured = every(
          items,
          ({ state }) =>
            state?.matches("configured") &&
            state.context.isDirty !== true &&
            state.context.isNew !== true
        );
        return items?.length && itemsConfigured; //&& !bin?.length;
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

      isNotLoading: ({ items, actors }) => {
        return (
          every(
            actors,
            actor =>
              !["loading", "available.loading"].some(actor?.state.matches)
          ) && every(items, actor => !actor?.state.matches("loading"))
        );
      },

      hasNoItem: (_context, { data }) => isEmpty(data) || !data?.itemId,

      hasNoItems: ({ items }) => isEmpty(items),
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
      poll: () => useTime().POLL,
    },

    services,
  }
);
