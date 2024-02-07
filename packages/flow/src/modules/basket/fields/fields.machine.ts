// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils

import { useTime, useValidationParser } from "../../../utils";
import { useSchema, useUischema, useModelParser } from "./utils";

// --- types
import type { FieldsContext, FieldsEvent } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./fields.machine.typegen").Typegen0,
    id: "fieldsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      fields: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: null
    } as FieldsContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continu
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
        entry: sendParent(({ model }: FieldsContext, event: FieldsEvent) => ({
          type: "REFRESH",
          data: model
        })),
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
        (_context: FieldsContext, { data }: FieldsEvent) => data
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

      // ---
      setFeedbackSuccess: (_context, _event) => {
        addSuccess("Successfully updated the basket fields");
      },

      setFeedbackError: ({ error }, _event) => {
        addError({
          title:
            error?.title ||
            "We experienced an error updating the basket fields",
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
