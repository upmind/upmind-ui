/** @internal */
import { createMachine, assign } from "xstate";
import { parseBasketFieldsModel } from "../basket/basket.utils";
import { useFeedback } from "../feedback";
import { useI18n } from "../system-localisation";
import services from "./basket-fields.services";
import { useSchema, useUischema } from "./basket-fields.utils";
import {
  useTime,
  mapToHeadlessError,
  useValidationParser,
  isDirty
} from "../../utils";
import { responseCodes } from "../../utils";
import { cloneDeep } from "lodash-es";
import type { FieldsContext } from "./basket-fields.types";
import type { AnyEventObject } from "xstate";

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
            actions: ["setError"]
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
                  target: "#complete",
                  actions: ["clearAutoUpdate"]
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
        entry: ["clearError"],
        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["persistModel", "clearAutoUpdate"]
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
        actions: ["setAutoUpdate"]
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
            model: parseBasketFieldsModel(data),
            error: data?.error
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

      clearModel: assign({
        model: undefined
      }),

      persistModel: assign({
        baseModel: ({ model }: FieldsContext) => cloneDeep(model) // we use spread to ensure its a new array
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }: AnyEventObject) => !!update
      }),
      clearAutoUpdate: assign({
        autoupdate: false
      }),

      // ---

      setFeedbackError: ({ error }: FieldsContext, _event) => {
        const { t } = useI18n();
        if (!error || error?.status == responseCodes.Unprocessable_Entity)
          return;

        useFeedback().addError({
          title: t("error.basket_fields_update_failed"),
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
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
        isDirty(model, baseModel),
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
