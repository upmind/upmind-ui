// --- external
import { createMachine, assign, actions } from "xstate";
const { sendParent } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser, useModelParser } from "../../../utils";
import { useSchema, useUischema } from "./utils";
import { useBasketFieldsModelParser } from "../utils";

// --- types
import type { FieldsContext, FieldsEvent } from "./types.d";
import { responseCodes } from "../../api";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./fields.machine.typegen").Typegen0,
    id: "basketFieldsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basket_id: undefined,
      fields: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      dirty: false,
      error: null,
      autoupdate: false,
    } as FieldsContext,
    states: {
      loading: {
        entry: ["clearError"],
        invoke: {
          src: "load",
          onDone: {
            target: "checking",
            actions: ["setContext", "setSchemas"],
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"],
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
                actions: ["setContext", "setSchemas"],
              },
            },
          },
          validating: {
            invoke: {
              src: "validate",
              onDone: [
                {
                  target: "#valid",
                  cond: "isDirty",
                },
                {
                  target: "#complete",
                },
              ],
              onError: {
                target: "#invalid",
                actions: ["setError"],
              },
            },
          },
        },
      },

      valid: {
        id: "valid",
        always: { target: "processing", cond: "shouldUpdate" },

        on: {
          UPDATE: {
            target: "processing",
            cond: "hasBasket",
          },
        },
      },

      invalid: {
        id: "invalid",
      },

      processing: {
        entry: ["clearError"],

        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["setModel", "clearDirty", "clearAutoUpdate"],
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"],
          },
        },
      },

      processed: {
        id: "processed",
        entry: sendParent((_context, { data }) => ({
          type: "REFRESH",
          data,
        })),
        after: {
          wait: {
            target: "complete",
          },
        },
      },

      complete: {
        id: "complete",
        // type: "final"
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
        actions: ["clearModel", "setDirty"],
      },
      SET: {
        target: "checking",
        actions: ["setModel", "setDirty", "setAutoUpdate"],
      },

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"],
      },
      REFRESH: {
        target: "checking",
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged",
      },
    },
  },
  {
    actions: {
      refreshContext: assign(
        (_context: FieldsContext, { data: basket }: FieldsEvent) => {
          return {
            basket_id: basket?.id,
            model: useBasketFieldsModelParser(basket),
          };
        }
      ),

      setContext: assign(
        (_context: FieldsContext, { data }: FieldsEvent) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ fields, model }) => useModelParser(fields, model),
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

      setDirty: assign({
        dirty: true,
      }),

      clearDirty: assign({
        dirty: false,
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }) => !!update,
      }),
      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      // ---
      setFeedbackSuccess: (_context, _event) => {
        addSuccess("Successfully updated the basket fields");
      },

      setFeedbackError: ({ error }, _event) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;

        addError({
          title:
            error?.title ||
            "We experienced an error updating the basket fields",
          copy: error?.message,
          data: error?.data,
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
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      isDirty: ({ dirty }, _event) => !!dirty,
      hasBasket: ({ basket_id }, _event) => !!basket_id,
      hasChanged: ({ model, basket_id }, { data }) => {
        model?.notes !== data?.notes ||
          model?.custom_fields !== data?.custom_fields ||
          basket_id !== data?.id;
      },
      shouldUpdate: ({ autoupdate, basket_id }, _event) =>
        !!autoupdate && !!basket_id,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
