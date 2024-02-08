// --- external
import { createMachine, assign, actions } from "xstate";
const { sendParent } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils

import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema, useModelParser } from "./utils";

// --- types
import type { PaymentDetailsContext, PaymentDetailsEvent } from "./types.d";

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
              onDone: {
                target: "#valid"
              },
              onError: {
                target: "#invalid",
                actions: ["setError"]
              }
            }
          }
        }
      },

      valid: {
        id: "valid",
        on: {
          UPDATE: {
            target: "processing"
          }
        }
      },

      invalid: {
        id: "invalid"
      },

      processing: {
        entry: ["clearError"],

        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["setModel", "setFeedbackSuccess"]
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },

      processed: {
        id: "processed",
        after: {
          wait: {
            target: "complete"
          }
        }
      },

      complete: {
        entry: sendParent(
          ({ model }: PaymentDetailsContext, _event: PaymentDetailsEvent) => ({
            type: "REFRESH",
            data: model
          })
        ),
        type: "final"
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
      UPDATE: {
        target: ".processing"
      },
      CLEAR: {
        target: "checking",
        actions: ["clearModel"]
      },
      SET: {
        target: "checking",
        actions: ["setModel"]
      }
    }
  },
  {
    actions: {
      setContext: assign(
        (_context: PaymentDetailsContext, { data }: PaymentDetailsEvent) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }) => useModelParser(schema, model)
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: ({ fields }, { data }) => useModelParser(fields, data)
      }),

      clearModel: assign({
        model: undefined
      }),

      setFields: assign({
        fields: (_context, { data }) => data
      }),

      // ---
      setFeedbackSuccess: (_context, _event) => {
        addSuccess("Successfully updated the basket");
      },

      setFeedbackError: ({ error }, _event) => {
        addError({
          title:
            error?.title ||
            "We experienced an error updating the payment details",
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

    guards: {},

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
