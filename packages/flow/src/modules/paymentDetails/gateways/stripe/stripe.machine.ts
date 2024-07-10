// --- external
import { createMachine, assign, sendParent, spawn } from "xstate";

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

// --- types
import type { StripeContext, StripeEvent } from "./types.d";
import { GatewayCtx } from "../types.d";
import { responseCodes } from "../../../api";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./stripe.machine.typegen").Typegen0,
    id: "stripePaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basket_id: undefined,
      currency: undefined,
      gateway: undefined,
      amount: undefined,
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
                target: "..checking",
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
                target: "..checking",
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
            },
          },
          validating: {
            invoke: {
              src: "validate",
              onDone: { target: "#valid" },
              onError: {
                target: "#invalid",
                actions: ["setError"],
              },
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
        on: {
          RETRY: {
            target: "processing",
          },
        },
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
        validationObserver: (
          _context: StripeContext,
          { data }: StripeEvent
        ) => {
          const stripeChangeEvent = callback => {
            data.element.on("change", event =>
              callback({ type: "VALIDATE", data: event })
            );

            return () => {};
          };

          return spawn(stripeChangeEvent);
        },
      }),

      setElementStatus: assign({
        elementStatus: (_context: StripeContext, { data }: StripeEvent) => data,
      }),

      setClientDetails: assign({
        clientPaymentDetailsId: (
          _context: StripeContext,
          { data }: StripeEvent
        ) => data?.clientPaymentDetailsId,
        clientSecret: (_context: StripeContext, { data }: StripeEvent) =>
          data?.clientSecret,
      }),

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

      updateStripe: ({ elements }: StripeContext, { data }: StripeEvent) => {
        elements.update({
          amount: Math.round((data?.amount || 0) * 100), // NB: Stripe expects amount in cents
          currency: data?.currency.code.toLowerCase(), // NB: MUST be lowercase
        });
      },

      // ---
      setPaymentDetails: assign({
        paymentDetails: ({ gateway }, { data }) => {
          return { gateway, ...data };
        },
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails,
      })),

      // ---
      setFeedbackError: ({ error }: StripeContext, _event: StripeEvent) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;
        addError({
          title:
            error?.title || "We experienced an error processing your payment",
          copy: error?.message,
          data: error?.data,
        });
      },

      setError: assign({
        error: (_context: StripeContext, { data }: StripeEvent) => {
          let error = data?.error;
          if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      hasNoOutstandingBalance: (
        _context: StripeContext,
        _event: StripeEvent
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      },

      isAdding: ({ ctx }: StripeContext, _event: StripeEvent) => {
        return ctx === GatewayCtx.ADD;
      },
      isPaying: ({ ctx }: StripeContext, _event: StripeEvent) => {
        return ctx === GatewayCtx.PAY;
      },
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
