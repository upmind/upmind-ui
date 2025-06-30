// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, actions, sendParent } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./card/services";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import { useTime, useValidationParser, useModelParser } from "../../../utils";
import { useSchema, useUischema } from "./utils";

// --- types
import type { GatewayContext } from "./types";
import { responseCodes } from "../../../utils";
import { isArray } from "xstate/lib/utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./gateway.machine.typegen").Typegen0,
    id: "gatewayPaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      orderId: undefined,
      currency: undefined,
      gateway: undefined,
      amount: undefined,
      renderless: undefined,
      // ---
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: undefined
    } as GatewayContext,
    states: {
      loading: {
        invoke: {
          src: "load",
          onDone: { target: "checking", actions: ["setContext"] },
          onError: {
            target: "#error",
            actions: ["setError", "setFeedbackError"]
          }
        }
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
                actions: ["setSchemas", "setModel"]
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
            actions: ["setPaymentDetails", "providePaymentDetails"]
          },
          onError: {
            target: "#error",
            actions: [
              "setError",
              "setFeedbackError",
              "escalateError",
              "cancelPaymentDetails"
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
        data: ({ paymentDetails }: GatewayContext, _event: AnyEventObject) =>
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
        target: "checking",
        actions: ["clearModel"]
      },
      SET: {
        target: "checking",
        actions: ["setModel"]
      },
      REFRESH: {
        target: "checking",
        actions: ["setContext"]
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
        // TODO: (_context: CurrencyContext, { data }: CurrencyEvent) => data
        (_context: any, { data }: AnyEventObject) => data
      ),

      // ---
      setSchemas: assign({
        schema: context => useSchema(context),
        // TODO: uischema: context => useUischema(context),
        uischema: () => useUischema()
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: (
          { schema, model }: GatewayContext,
          { data }: AnyEventObject
        ) => {
          if (!schema) return data ?? model;
          return useModelParser(schema, data ?? model);
        }
      }),

      clearModel: assign({
        model: undefined
      }),

      // ---
      setPaymentDetails: assign({
        paymentDetails: (
          { gateway }: GatewayContext,
          { data }: AnyEventObject
        ) => {
          return { gateway, ...data };
        }
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails
      })),

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL"
      })),

      escalateError: (_context, { data }: AnyEventObject) => {
        escalate({ data });
      },

      // ---

      setFeedbackError: ({ error }: GatewayContext, _event: AnyEventObject) => {
        if (
          !error ||
          isArray(error) ||
          error?.status == responseCodes.Unprocessable_Entity
        )
          return;
        addError({
          title: "We experienced an error processing your payment",
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context: GatewayContext, { data }: AnyEventObject) => {
          let error = data?.error;
          if (data?.status == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        }
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      hasNoOutstandingBalance: (
        _context: GatewayContext,
        _event: AnyEventObject
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
