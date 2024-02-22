// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import services from "./card/services";
import { useFeedback } from "../../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser } from "../../../utils";
import { useSchema, useUischema, useModelParser } from "./utils";

// --- types
import type { GatewayContext, GatewayEvent } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./gateway.machine.typegen").Typegen0,
    id: "gatewayPaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      gateway: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: null
    } as GatewayContext,
    states: {
      loading: {
        invoke: {
          src: "load",
          onDone: { target: "checking" },
          onError: {
            target: "#error",
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
        on: {
          CHECKOUT: "processing",
          PAY: "processing"
        }
      },

      processing: {
        entry: ["clearError"],
        invoke: {
          src: "update",
          onDone: {
            target: "#processed",
            actions: [
              "setPaymentDetails",
              "providePaymentDetails",
              "setFeedbackSuccess"
            ]
          }
        }
      },

      processed: {
        id: "processed",
        after: {
          wait: {
            target: "complete",
            cond: "hasNoOutstandingBalance"
          }
        }
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ paymentDetails }: GatewayContext, _event: GatewayEvent) =>
          paymentDetails
      },

      error: {
        id: "error",
        on: {
          RETRY: {
            target: "processing"
          }
        }
      }
    },
    on: {
      CLEAR: {
        target: "#checking",
        actions: ["clearModel"]
      },
      SET: {
        target: "#checking",
        actions: ["setModel"]
      },

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"]
      }
    }
  },
  {
    actions: {
      setContext: assign(
        (_context: CurrencyContext, { data }: CurrencyEvent) => data
      ),

      // ---
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

      // ---
      setPaymentDetails: assign({
        paymentDetails: (_context, { data }) => data
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails
      })),

      // ---
      setFeedbackSuccess: (_context: GatewayContext, _event: GatewayEvent) => {
        addSuccess("Successfully made payment");
      },

      setFeedbackError: ({ error }: GatewayContext, _event: GatewayEvent) => {
        addError({
          title:
            error?.title || "We experienced an error processing your payment",
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context: GatewayContext, { data }: GatewayEvent) => {
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
      hasNoOutstandingBalance: (
        _context: GatewayContext,
        _event: GatewayEvent
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
