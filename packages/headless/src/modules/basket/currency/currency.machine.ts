// --- external
import { assign, createMachine, sendParent } from "xstate";

// --- internal
import services, { CURRENCY_STORAGE_KEY } from "./services";
import { useI18n } from "../../system";
import { useFeedback } from "../../feedback";

// --- utils
import {
  useTime,
  responseCodes,
  useModelParser,
  mapToHeadlessError,
  useValidationParser
} from "../../../utils";
import { useSchema, useUischema } from "./utils";
import { cloneDeep, get, isEqual } from "lodash-es";
import { useSessionStorage } from "../../../utils/useStorage";

// --- types
import type { AnyEventObject } from "xstate";
import type { CurrencyContext } from "./types";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    id: "basketCurrencyManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as CurrencyContext,
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
            target: "#error",
            actions: ["setError", "setFeedbackError"]
          }
        },
        on: {
          SET: {
            actions: ["setModel", "setAutoUpdate"]
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
        always: [
          { target: "processing", cond: "shouldUpdate" },
          // if we should update but can't, we dont have a basket,
          {
            actions: ["persistModel", "clearAutoUpdate", "refreshBasket"],
            cond: "cantUpdate"
          }
        ],

        on: {
          UPDATE: [
            {
              target: "processing",
              cond: "hasBasket"
            }
          ]
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
            actions: ["clearAutoUpdate", "persistModel"]
          },
          onError: {
            target: "#error",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },

      processed: {
        id: "processed",
        entry: [
          sendParent((_ctx: CurrencyContext, { data }: AnyEventObject) => ({
            type: "PREFRESH",
            data
          })),
          sendParent({ type: "REFRESH" })
        ],
        after: { wait: { target: "complete" } }
      },

      complete: {
        id: "complete"
        // type: "final"
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
        actions: ["setModel", "setAutoUpdate"]
      },

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"]
      },
      REFRESH: {
        target: "loading",
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged"
      }
    }
  },
  {
    actions: {
      refreshContext: assign((_context, { data: basket }: AnyEventObject) => {
        return {
          basketId: basket?.id,
          model: basket?.currency
        };
      }),

      setContext: assign(
        (_context: CurrencyContext, { data }: AnyEventObject) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }) => {
          if (!schema) return model;
          return useModelParser(schema, model);
        }
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: (
          { schema, model }: CurrencyContext,
          { data }: AnyEventObject
        ) => {
          const currency = get(data, "currency", data);
          if (!schema) return currency ?? model;
          return useModelParser(schema, currency ?? model);
        }
      }),

      clearModel: assign({
        model: undefined
      }),

      persistModel: assign({
        baseModel: ({ model }: CurrencyContext) => {
          const baseModel = cloneDeep(model);
          // NB: persist to storage so that we can retrieve the currency when the user refreshes the page without a basket
          if (baseModel?.code) {
            useSessionStorage().set(CURRENCY_STORAGE_KEY, baseModel.code);
          }
          return baseModel;
        }
      }),

      setAutoUpdate: assign({
        autoupdate: (_context: CurrencyContext, { update }: AnyEventObject) =>
          !!update
      }),
      clearAutoUpdate: assign({
        autoupdate: false
      }),

      refreshBasket: sendParent(
        ({ model }: CurrencyContext, _event: AnyEventObject) => {
          return {
            type: "REFRESH",
            data: { currency: model, currency_id: model?.id }
          };
        }
      ),

      // ---

      setFeedbackError: ({ error }: CurrencyContext, _event) => {
        const { t } = useI18n();
        if (!error || error?.status == responseCodes.Unprocessable_Entity)
          return;
        useFeedback().addError({
          title: t("error.currency_update_failed"),
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
      isDirty: ({ model, baseModel }: CurrencyContext, _event) =>
        !isEqual(model?.id, baseModel?.id),
      hasBasket: ({ basketId }: CurrencyContext, _event) => !!basketId,
      hasNoBasket: ({ basketId }: CurrencyContext, _event) => !basketId,
      hasChanged: (
        { model, basketId }: CurrencyContext,
        { data }: AnyEventObject
      ) => model?.id !== data?.currency_id || basketId !== data?.id,
      shouldUpdate: ({ autoupdate, basketId }: CurrencyContext, _event) =>
        !!autoupdate && !!basketId,
      cantUpdate: ({ autoupdate, basketId }: CurrencyContext, _event) =>
        !!autoupdate && !basketId
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
