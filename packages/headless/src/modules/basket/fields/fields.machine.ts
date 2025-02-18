// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";
// const { sendParent } = actions; DEPRECATED

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser, useModelParser } from "../../../utils";
import { useSchema, useUischema } from "./utils";
import { parseBasketFieldsModel } from "../utils";

// --- types
import type { FieldsContext } from "./types";
import { responseCodes } from "../../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./fields.machine.typegen").Typegen0,
    id: "basketFieldsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basketId: undefined,
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
            actions: ["clearDirty", "clearAutoUpdate"],
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"],
          },
        },
      },

      processed: {
        id: "processed",
        // DEPRECATED: No need to refresh parent basket
        // entry: sendParent((_context, { data }: any) => ({
        //   type: "REFRESH",
        //   data,
        // })),
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
        (_context: FieldsContext, { data }: AnyEventObject) => {
          return {
            basketId: data?.id,
            model: parseBasketFieldsModel(data),
          };
        }
      ),

      setContext: assign(
        (_context: FieldsContext, { data }: AnyEventObject) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined,
      }),

      setModel: assign({
        model: ({ schema, model }: FieldsContext, { data }: AnyEventObject) =>
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
        autoupdate: (_context, { update }: AnyEventObject) => !!update,
      }),
      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      // ---
      // setFeedbackSuccess: (_context: any, _event: any) => {
      //   addSuccess("Successfully updated the basket fields");
      // },

      setFeedbackError: ({ error }: FieldsContext, _event) => {
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
        error: (_context, { data }: any) => {
          let error = data?.error;
          if (error?.code == responseCodes.Unprocessable_Entity) {
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
      isDirty: ({ dirty }: FieldsContext) => !!dirty,
      hasBasket: ({ basketId }: FieldsContext) => !!basketId,
      hasChanged: (
        { model, basketId }: FieldsContext,
        { data }: AnyEventObject
      ) =>
        model?.notes !== data?.notes ||
        model?.customFields !== data?.customFields ||
        basketId !== data?.id,

      shouldUpdate: ({ autoupdate, basketId }: FieldsContext) =>
        !!autoupdate && !!basketId,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
