// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

// --- internal
import services from "./services";

// --- utils
import { useTime } from "../../utils";
import {
  useValidationParser,
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser
} from "./utils";
import { isEmpty } from "lodash-es";

// ---types
import type { FieldsContext } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./fields.machine.typegen").Typegen0,
    id: "basketFields",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      customFields: [],
      model: {},
      schema: {},
      uischema: {},
      // ---
      error: null
    } as FieldsContext,
    states: {
      loading: {
        invoke: {
          src: "getCustomFields",
          onDone: {
            target: "idle",
            actions: ["setCustomFields", "setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError", "escalateError"]
          }
        }
      },

      idle: {
        always: {
          target: "checking",
          cond: "isDirty"
        }
      },

      checking: {
        entry: ["clearError"],
        invoke: {
          src: "validateFields",
          onDone: {
            target: "valid"
          },
          onError: {
            target: "invalid",
            actions: ["setError", "escalateError"]
          }
        }
      },

      valid: {
        entry: ["sendValues"],
        on: {
          REFRESH: {
            target: "loading",
            actions: ["setValues", "setClean"]
          },
          SUBMIT: {
            actions: ["sendValues"]
          }
        }
      },

      invalid: {},

      // Handle errors
      error: {
        id: "error"
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final",
        data: (context, event) => context.model
      }
    },
    on: {
      INPUT: { target: "checking", actions: ["setModel"] },
      RESET: { target: "idle", actions: ["clearModel"] }
    }
  },
  {
    actions: {
      setCustomFields: assign({
        customFields: (context, { data }) => data
      }),

      setSchemas: assign({
        schema: ({ customFields }) => useFieldsSchemaParser(customFields),
        uischema: ({ customFields }) => useFieldsUischemaParser(customFields),
        model: ({ customFields }) => useFieldsModelParser(customFields)
      }),

      setModel: assign({
        model: (context, { data }) => data
      }),

      sendValues: sendParent(({ model }) => ({
        type: "UPDATE.FIELDS",
        data: model
      })),

      // ---
      clearModel: assign({
        model: {}
      }),
      // ---
      setError: assign({
        error: (context, { data: { error } }) => {
          if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            return useValidationParser(error);
          }

          return error;
        }
      }),

      escalateError: escalate(({ error }) => error),

      clearError: assign({ error: null })
    },
    guards: {
      isDirty: ({ model }) => !isEmpty(model)
    },

    delays: {
      error: () => useTime().SECOND * 3, // this allows us to read the error before continuing
      wait: () => useTime().MILLISECOND * 100 // this allows us to wait for a imperceptible amount of time before continuing
    },
    services
  }
);
