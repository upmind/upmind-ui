// --- external
import { createMachine, assign, AnyEventObject } from "xstate";
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
import type { FieldsContext, FieldsEvent } from "./types";
import { responseCodes } from "../../api";

// --------------------------------------------------------

export default createMachine(
  {
    // @ts-ignore
    // tsTypes: {} as import("./fields.machine.typegen").Typegen0,
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
        (_context: FieldsContext, { data }: FieldsEvent) => {
          return {
            // @ts-ignore
            basketId: data?.id,
            model: parseBasketFieldsModel(data),
          };
        }
      ),

      // @ts-ignore
      setContext: assign(
        // @ts-ignore
        (_context: FieldsContext, { data }: FieldsEvent) => data
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
        // @ts-ignore
        autoupdate: (_context, { update }) => !!update,
      }),
      clearAutoUpdate: assign({
        // @ts-ignore
        autoupdate: false,
      }),

      // ---
      setFeedbackSuccess: (_context: any, _event: any) => {
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
      // @ts-ignore
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
      // @ts-ignore
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    // @ts-ignore
    services,
  }
);
