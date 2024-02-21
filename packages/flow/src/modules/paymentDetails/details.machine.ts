// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import stripeMachine from "./gateways/stripe/stripe.machine";
import services, { PaymentTypes } from "./services";
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();
import { responseCodes } from "../api";

// --- utils
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema, useModelParser } from "./utils";
import { find } from "lodash-es";

// --- types
import type {
  PaymentDetailsContext,
  PaymentDetailsEvent,
  RefreshEvent
} from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./details.machine.typegen").Typegen0,
    id: "paymentDetailsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      fields: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      dirty: false,
      error: null
    } as PaymentDetailsContext,
    states: {
      loading: {
        entry: ["clearError"],
        invoke: {
          src: "load",
          onDone: {
            target: "checking",
            actions: ["setContext", "setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },
      // ---
      checking: {
        entry: ["clearError"],
        id: "checking",
        initial: "parsing",
        states: {
          parsing: {
            invoke: {
              src: "parse",
              onDone: {
                target: "validating",
                actions: ["setContext", "setSchemas"]
              }
            }
          },
          validating: {
            invoke: {
              src: "validate",
              onDone: { target: "#valid" },
              onError: {
                target: "#invalid",
                actions: ["setError"]
              }
            }
          }
        }
      },

      invalid: { id: "invalid" },

      valid: {
        id: "valid",
        initial: "gateway",
        states: {
          gateway: {
            always: [
              { target: "stripe", cond: "isStripe" },
              { target: "complete" } // catchall if theres no matching gateway
            ]
          },

          // ---
          stripe: {
            id: "stripe",
            invoke: {
              src: stripeMachine,
              autoForward: true,
              data: (
                { gateways, model, currency }: PaymentDetailsContext,
                _event
              ) => ({
                gateway: find(gateways, { gateway_id: model.gateway_id })
                  ?.gateway, // we dont need the full brand gateway, just the actual gateway
                isPayment: true,
                amount: model?.amount || 0,
                currency
              }),
              onDone: {
                target: "#complete",
                actions: ["setPaymentDetails", "providePaymentDetails"]
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            },
            on: {
              MOUNT: {
                actions: ["setElementToMount"]
              }
            }
          },
          // ---
          // TODO: add other payment methods/machines state nodes
          // ---
          complete: {
            type: "final"
          }
        }
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ paymentDetails }, _event) => paymentDetails
      },

      // ---

      error: {
        id: "error"
      }
    },
    on: {
      CLEAR: {
        target: "#checking",
        actions: ["clearModel", "setDirty"]
      },
      SET: {
        target: "#checking",
        actions: ["setModel", "setDirty"]
      },

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"]
      },

      REFRESH: {
        target: "loading",
        actions: ["refreshContext", "setSchemas"]
      }
    }
  },
  {
    actions: {
      refreshContext: assign(
        (_context: PaymentDetailsContext, { data: basket }: RefreshEvent) => ({
          basket_id: basket?.id,
          currency: basket?.currency,
          model: {
            amount: basket?.unpaid_amount_converted || 0.0
          }
        })
      ),

      setContext: assign(
        (_context: PaymentDetailsContext, { data }: PaymentDetailsEvent) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: context => useModelParser(context, context.model)
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: (context, { data }) => useModelParser(context, data)
      }),

      clearModel: assign({
        model: undefined
      }),

      setDirty: assign({
        dirty: true
      }),

      clearDirty: assign({
        dirty: false
      }),
      // ---

      setElementToMount: assign({
        mount: (_context, { data }) => data
      }),

      // ---

      setPaymentDetails: assign({
        paymentDetails: (_context, { data }) => data
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails
      })),

      // ---

      provideElements: sendParent(({ element }) => ({
        type: "MOUNT",
        data: element
      })),

      // ---
      setFeedbackSuccess: (_context, _event) => {
        addSuccess("Successfully placed the order!");
      },

      setFeedbackError: ({ error }, _event) => {
        // dont show any unauthorized errors
        if (error?.code == responseCodes.Unauthorized) return;

        addError({
          title:
            error?.title ||
            "We experienced an error while processing your order. Please try again.",
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context, { data }) => {
          let error = data?.error;
          if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        }
      }),

      clearError: assign({ error: null })
    },

    guards: {
      needsGateway: ({ model }, _event) =>
        model.type !== PaymentTypes.PAY_LATER,
      noGateway: ({ model }, _event) => model.type == PaymentTypes.PAY_LATER,

      isStripe: (_context, _event) => true // TODO actual check
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
