// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, actions, spawn } from "xstate";
const { sendParent, escalate } = actions;
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
import type { StripeContext } from "./types";
import { GatewayCtx } from "../types";
import { responseCodes } from "../../../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./stripe.machine.typegen").Typegen0,
    id: "stripePaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      orderId: undefined,
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
        data: ({ paymentDetails }: StripeContext, _event: AnyEventObject) =>
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
        elements: (_context: StripeContext, { data }: AnyEventObject) =>
          data?.elements,
        element: (_context: StripeContext, { data }: AnyEventObject) =>
          data?.element,
        renderer: (_context: StripeContext, { data }: AnyEventObject) => {
          function renderer(container: HTMLElement) {
            data?.element?.mount(container);
          }
          return renderer;
        },
        validationObserver: (
          _context: StripeContext,
          { data }: AnyEventObject
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
        elementStatus: (_context: StripeContext, { data }: AnyEventObject) =>
          data,
      }),

      setClientDetails: assign({
        clientPaymentDetailsId: (
          _context: StripeContext,
          { data }: AnyEventObject
        ) => data?.clientPaymentDetailsId,
        clientSecret: (_context: StripeContext, { data }: AnyEventObject) =>
          data?.clientSecret,
      }),

      setContext: assign(
        (_context: StripeContext, { data }: AnyEventObject) => data
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
        model: ({ schema, model }: StripeContext, { data }: AnyEventObject) =>
          useModelParser(schema, data || model),
      }),

      clearModel: assign({
        model: undefined,
      }),
      // ---

      updateStripe: (
        { elements, element }: StripeContext,
        { data }: AnyEventObject
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
        paymentDetails: ({ gateway }: StripeContext, { data }: any) => {
          return { gateway, ...data };
        },
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails,
      })),

      escalateError: (_context, { data }: AnyEventObject) => {
        escalate({ data });
      },

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL",
      })),

      // ---
      setFeedbackError: ({ error }: StripeContext, _event: AnyEventObject) => {
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

      setError: assign({
        error: (_context: StripeContext, { data }: AnyEventObject) => {
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
          return error;
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      hasChanged: (
        { orderId, currency, amount, address }: StripeContext,
        { data }: AnyEventObject
      ) => {
        const value =
          orderId !== data.orderId ||
          currency !== data.currency ||
          amount !== data.amount ||
          address?.id !== data.address?.id;
        return value;
      },

      hasNoElements: ({ elements }: StripeContext, _event: AnyEventObject) =>
        !elements,

      hasNoOutstandingBalance: (
        _context: StripeContext,
        _event: AnyEventObject
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      },

      isAdding: ({ ctx }: StripeContext, _event: AnyEventObject) => {
        return ctx !== undefined && ctx == GatewayCtx.ADD;
      },
      isPaying: ({ ctx }: StripeContext, _event: AnyEventObject) => {
        return ctx !== undefined && ctx == GatewayCtx.PAY;
      },
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
