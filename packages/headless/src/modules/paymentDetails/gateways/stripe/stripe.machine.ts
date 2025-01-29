// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { pure, sendParent, escalate } = actions;
import { filter, isString, includes, lowerCase } from "lodash-es";

// --- internal
import services from "./services";
import { useFeedback } from "../../../feedback";
const { addError } = useFeedback();

// --- utils
import {
  useTime,
  useValidationParser,
  useModelParser,
} from "../../../../utils";
import { useSchema, useUischema } from "./utils";
import { isFunction } from "lodash-es";

// --- types
import type { StripeContext, StripeEvent } from "./types";
import { GatewayContext } from "@upmind-automation/types";
import { responseCodes } from "../../../api";

// --------------------------------------------------------

export default createMachine(
  {
    // tsTypes: {} as import("./stripe.machine.typegen").Typegen0,
    id: "stripePaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basket_id: undefined,
      currency: undefined,
      gateway: undefined,
      amount: undefined,
      address: undefined,
      renderless: false, // stripe is not renderless
      // ---
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: null,
    } as StripeContext,
    states: {
      loading: {
        id: "loading",
        initial: "stripe",
        states: {
          stripe: {
            invoke: {
              src: "load",
              onDone: [
                {
                  target: "addElement",
                  actions: ["setContext"],
                  cond: "isAdding",
                },
                {
                  target: "paymentElement",
                  actions: ["setContext"],
                  // cond: "isPaying"
                },
              ],
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
          paymentElement: {
            invoke: {
              src: "createPaymentElement",
              onDone: {
                target: "#checking",
                actions: ["setElements"],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },

          addElement: {
            invoke: {
              src: "createAddElement",
              onDone: {
                target: "#checking",
                actions: ["setElements", "setClientDetails"],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
        },
      },

      // ---
      checking: {
        id: "checking",
        entry: ["clearError"],
        initial: "parsing",
        states: {
          parsing: {
            invoke: {
              src: "parse",
              onDone: {
                target: "validating",
                actions: ["setContext", "setSchemas", "setModel"],
              },
              onError: {
                target: "#invalid",
                actions: ["setError"],
              },
            },
          },
          validating: {
            invoke: {
              src: "validate",
              onDone: { target: "#valid" },
              onError: [
                {
                  target: "#loading",
                  cond: "hasNoElements",
                },
                {
                  target: "#invalid",
                  actions: ["setError"],
                },
              ],
            },
          },
        },
      },

      invalid: { id: "invalid" },

      valid: {
        id: "valid",
        on: {
          CHECKOUT: "processing.payment",
          PAY: "processing.payment",
          ADD: "processing.adding",
        },
      },

      processing: {
        entry: ["clearError"],
        states: {
          payment: {
            invoke: {
              src: "update",
              onDone: {
                target: "#processed",
                actions: ["setPaymentDetails", "providePaymentDetails"],
              },
              onError: {
                target: "#error",
                actions: [
                  "setError",
                  "setFeedbackError",
                  "escalateError",
                  "cancelPaymentDetails",
                ],
              },
            },
          },
          adding: {
            invoke: {
              src: "confirmSetup",
              onDone: {
                target: "#processed",
                actions: ["set"],
              },
            },
          },
        },
      },

      processed: {
        id: "processed",
        after: {
          wait: {
            target: "complete",
            cond: "hasNoOutstandingBalance",
          },
        },
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ paymentDetails }: StripeContext, _event: StripeEvent) =>
          paymentDetails,
      },

      error: {
        id: "error",
      },
    },
    on: {
      CLEAR: {
        target: "checking",
        actions: ["clearModel"],
      },
      SET: {
        target: "checking",
        actions: ["setModel"],
      },
      VALIDATE: {
        target: "checking.validating",
        actions: ["setElementStatus"],
      },
      REFRESH: {
        target: "checking",
        actions: ["setContext", "updateStripe"],
        cond: "hasChanged",
      },
      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"],
      },
    },
  },
  {
    actions: {
      setElements: assign({
        elements: (_context: StripeContext, { data }: StripeEvent) =>
          data?.elements,
        element: (_context: StripeContext, { data }: StripeEvent) =>
          data?.element,
        renderer: (_context: StripeContext, { data }: StripeEvent) => {
          function renderer(container: HTMLElement) {
            data?.element?.mount(container);
          }
          return renderer;
        },
        // @ts-ignore
        validationObserver: (
          _context: StripeContext,
          { data }: StripeEvent
        ) => {
          const stripeChangeEvent = (callback: any) => {
            data.element.on("change", (event: any) =>
              callback({ type: "VALIDATE", data: event })
            );

            return () => {};
          };

          return spawn(stripeChangeEvent);
        },
      }),

      setElementStatus: assign({
        // @ts-ignore
        elementStatus: (_context: StripeContext, { data }: StripeEvent) => data,
      }),

      setClientDetails: assign({
        // @ts-ignore
        clientPaymentDetailsId: (
          _context: StripeContext,
          { data }: StripeEvent
        ) => data?.clientPaymentDetailsId,
        clientSecret: (_context: StripeContext, { data }: StripeEvent) =>
          data?.clientSecret,
      }),

      // @ts-ignore
      setContext: assign(
        (_context: StripeContext, { data }: StripeEvent) => data
      ),

      // ---
      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined,
      }),

      setModel: assign({
        model: ({ schema, model }, { data }) =>
          useModelParser(schema, data || model),
      }),

      clearModel: assign({
        model: undefined,
      }),
      // ---

      updateStripe: (
        { elements, element }: StripeContext,
        { data }: StripeEvent
      ) => {
        if (!isFunction(elements?.update)) return; // in case we receive an update before stripe has loaded

        const amount = Math.round((data?.amount || 0) * 100); // NB: Stripe expects amount in cents
        if (amount <= 0) return; // NB: Stripe requires a positive amount

        elements.update({
          amount,
          currency: data?.currency.code.toLowerCase(), // NB: MUST be lowercase
        });

        if (data.address) {
          element.update({
            defaultValues: {
              billingDetails: {
                address: {
                  postal_code: data.address?.postcode,
                  country: data.address?.country?.code,
                },
              },
            },
          });
        }
      },

      // ---
      setPaymentDetails: assign({
        paymentDetails: ({ gateway }, { data }: any) => {
          return { gateway, ...data };
        },
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails,
      })),

      // @ts-ignore
      escalateError: pure((_context, { data }) => {
        escalate({ data });
      }),

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL",
      })),

      // ---
      // @ts-ignore
      setFeedbackError: ({ error }: StripeContext, _event: StripeEvent) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;
        addError({
          title:
            error?.title ||
            "We experienced an error processing your payment details",
          copy: error?.message,
          data: error?.data,
        });

        // escalate({ data: error });
      },

      // @ts-ignore
      setError: assign({
        error: (_context: StripeContext, { data }: StripeEvent) => {
          let error = data?.error;
          if (error?.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          } else {
            error = error || data;

            if (error.message) {
              return [error];
            } else {
              return filter(
                error,
                e =>
                  isString(e.title) && !includes(lowerCase(e.title), "element")
              );
            }
          }
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      // @ts-ignore
      hasChanged: (
        { basketId, currency, amount, address }: StripeContext,
        { data }: StripeEvent
      ) => {
        const value =
          basketId !== data.basket_id ||
          currency !== data.currency ||
          amount !== data.amount ||
          address?.id !== data.address?.id;
        return value;
      },

      // @ts-ignore
      hasNoElements: ({ elements }: StripeContext, _event: StripeEvent) =>
        !elements,

      // @ts-ignore
      hasNoOutstandingBalance: (
        _context: StripeContext,
        _event: StripeEvent
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      },

      // @ts-ignore
      isAdding: ({ ctx }: StripeContext, _event: StripeEvent) => {
        // @ts-ignore
        return ctx === GatewayContext.ADD;
      },
      // @ts-ignore
      isPaying: ({ ctx }: StripeContext, _event: StripeEvent) => {
        // @ts-ignore
        return ctx === GatewayContext.PAY;
      },
    },

    delays: {
      // @ts-ignore
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    // @ts-ignore
    services,
  }
);
