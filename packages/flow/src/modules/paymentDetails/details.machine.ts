// --- external
import { createMachine, assign } from "xstate";

// --- internal
import stripeMachine from "./gateways/stripe/stripe.machine";
import services, { PaymentTypes } from "./services";
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();
import { responseCodes } from "../api";

// --- utils

import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema, useModelParser } from "./utils";

// --- types
import type {
  PaymentDetailsContext,
  PaymentDetailsEvent,
  RefreshEvent
} from "./types.d";
import { sendTo } from "xstate/lib/actions";

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
            target: "available",
            actions: ["setContext", "setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },
      // ---

      available: {
        id: "available",
        type: "parallel",
        states: {
          details: {
            initial: "checking",
            states: {
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
                      onDone: { target: "#available.details.valid" },
                      onError: {
                        target: "#available.details.invalid",
                        actions: ["setError"]
                      }
                    }
                  }
                }
              },
              invalid: {},
              valid: { type: "final" }
            }
          }
          // gateway: {
          //   id: "gateway",
          //   initial: "checking",
          //   states: {
          //     checking: {
          //       always: [
          //         { target: "complete", cond: "noGateway" },
          //         { target: "stripe", cond: "isStripe" },
          //         { target: "idle" }
          //       ]
          //     },
          //     idle: {
          //       on: {
          //         SELECT: [
          //           { target: "stripe", cond: "isStripe" }
          //           // ---
          //           // TODO: add other payment checks and actions
          //           // ---
          //           // For all other payment methods that DONT require a sub machine
          //           // { target: "#valid" }
          //         ]
          //       }
          //     },

          //     // ---
          //     stripe: {
          //       id: "stripe",
          //       invoke: {
          //         src: stripeMachine,
          //         autoForward: true,
          //         onDone: {
          //           target: "complete"
          //         },
          //         onError: {
          //           target: "#error",
          //           actions: ["setError", "setFeedbackError"]
          //         }
          //       }
          //     },
          //     // ---
          //     // TODO: add other payment methods/machines state nodes
          //     // ---
          //     complete: {
          //       type: "final"
          //     }
          //   }
          // }
        },
        onDone: "valid"
      },

      valid: {
        id: "valid"
      },

      complete: {
        id: "complete"
        // type: "final"
        // data: ({ order }, _event) => order
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
      noGateway: ({ model }, _event) => model.type == PaymentTypes.PAY_LATER
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
