// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import {
  useTime,
  useModelParser,
  mapToHeadlessError,
  useValidationParser
} from "../../../utils";
import { responseCodes } from "../../../utils";
import { useSchema, useUischema } from "./utils";
import { parseBasketFieldsModel } from "../utils";

// --- types
import { FieldsModel, FieldsContext } from "./types";
import { isEqual } from "lodash-es";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./fields.machine.typegen").Typegen0,
    id: "basketFieldsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as FieldsContext,
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
              onDone: [
                {
                  target: "#valid",
                  cond: "isDirty"
                },
                {
                  target: "#complete"
                }
              ],
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
        always: { target: "processing", cond: "shouldUpdate" },

        on: {
          UPDATE: {
            target: "processing",
            cond: "hasBasket"
          }
        }
      },

      invalid: {
        id: "invalid"
      },

      processing: {
        entry: ["clearError", "cancelController", "newController"],
        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["resetBaseModel", "clearAutoUpdate"]
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
        id: "complete"
        // type: "final"
      },

      error: {
        id: "error"
      }
    },
    on: {
      CLEAR: {
        target: "checking",
        actions: ["clearModel", "setDirty"]
      },
      SET: {
        target: "checking",
        actions: ["setModel", "setAutoUpdate"]
      },

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"]
      },
      REFRESH: {
        target: "checking",
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged"
      }
    }
  },
  {
    actions: {
      refreshContext: assign(
        (_context: FieldsContext, { data }: AnyEventObject) => {
          return {
            basketId: data?.id,
            model: parseBasketFieldsModel(data)
          };
        }
      ),

      setContext: assign(
        (_context: FieldsContext, { data }: AnyEventObject) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context)
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: ({ schema, model }: FieldsContext, { data }: AnyEventObject) => {
          if (!schema) return data ?? model;
          return useModelParser<FieldsModel>(schema, data ?? model);
        }
      }),

      resetBaseModel: assign({
        baseModel: (
          { schema, model, baseModel }: FieldsContext,
          _event: AnyEventObject
        ) => {
          return useModelParser<FieldsModel>(schema, model, baseModel, {
            allowExtraProps: false
          });
        }
      }),

      clearModel: assign({
        model: undefined
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }: AnyEventObject) => !!update
      }),
      clearAutoUpdate: assign({
        autoupdate: false
      }),

      cancelController: assign({
        controller: ({ controller }: FieldsContext) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return undefined;
        }
      }),

      newController: assign({
        controller: () => {
          return new AbortController();
        }
      }),

      // ---

      setFeedbackError: ({ error }: FieldsContext, _event) => {
        if (!error || error?.status == responseCodes.Unprocessable_Entity)
          return;

        addError({
          title: "We experienced an error updating the basket fields",
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          let error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      isDirty: ({ model, baseModel }: FieldsContext, _event) =>
        !isEqual(model, baseModel),
      hasBasket: ({ basketId }: FieldsContext) => !!basketId,
      hasChanged: (
        { model, basketId }: FieldsContext,
        { data }: AnyEventObject
      ) =>
        model?.notes !== data?.notes ||
        model?.customFields !== data?.customFields ||
        basketId !== data?.id,

      shouldUpdate: ({ autoupdate, basketId }: FieldsContext) =>
        !!autoupdate && !!basketId
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
