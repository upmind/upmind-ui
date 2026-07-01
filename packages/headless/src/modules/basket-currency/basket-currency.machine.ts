/** @internal */
import { assign, createMachine, sendParent, spawn } from "xstate";
import { useFeedback } from "../feedback";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import services from "./basket-currency.services";
import {
  clearCurrencyStorage,
  clearDefaultCurrency,
  getExplicitCurrency,
  persistExplicitCurrency,
  useSchema,
  useUischema
} from "./basket-currency.utils";
import {
  useTime,
  responseCodes,
  useModelParser,
  mapToHeadlessError,
  useValidationParser
} from "../../utils";
import { cloneDeep, get, isEqual } from "lodash-es";
import type { CurrencyContext } from "./basket-currency.types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    id: "basketCurrencyManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as CurrencyContext,
    states: {
      // Subscribe to auth changes before the first load so the machine reacts to
      // login/logout (it is spawned before the session is authenticated).
      subscribing: {
        id: "subscribing",
        entry: ["setAuthHelper", "clearError"],
        always: { target: "loading" }
      },

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

      AUTHENTICATED: {
        target: "loading",
        actions: [
          "clearDefaultStorage",
          "clearError",
          "clearModel",
          "clearSchemas"
        ],
        cond: "hasNoExplicitCurrency"
      },
      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearStorage", "clearError", "clearModel", "clearSchemas"]
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
      setAuthHelper: assign({
        authHelper: ({ authHelper }: CurrencyContext) =>
          authHelper ?? spawn(authSubscription)
      }),

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

      clearStorage: () => clearCurrencyStorage(),

      clearDefaultStorage: () => clearDefaultCurrency(),

      // Only reached after a user-driven SET (autoupdate), so the pick is stored
      // to the explicit `currency` key — it outranks account/locale resolution
      // and survives login. Auto-resolved seeds persist via `load`.
      persistModel: assign({
        baseModel: ({ model }: CurrencyContext) => {
          persistExplicitCurrency(model?.code);
          return cloneDeep(model);
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
      isDirty: ({ model, baseModel }: CurrencyContext, _event) =>
        !isEqual(model?.id, baseModel?.id),
      hasNoExplicitCurrency: (_context: CurrencyContext, _event) =>
        !getExplicitCurrency(),
      hasBasket: ({ basketId }: CurrencyContext, _event) => !!basketId,
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
