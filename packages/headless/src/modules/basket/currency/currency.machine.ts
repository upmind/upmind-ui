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
import { get } from "lodash-es";

// --- types
import type { CurrencyContext, CurrencyEvent } from "./types";
import { responseCodes } from "../../api";

// --------------------------------------------------------

export default createMachine(
  {
    // @ts-ignore
    tsTypes: {} as import("./currency.machine.typegen").Typegen0,
    id: "basketCurrencyManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basket_id: undefined,
      currencies: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      dirty: false,
      error: null,
      autoupdate: false,
    } as CurrencyContext,
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
        on: {
          SET: {
            actions: ["setModel", "setDirty", "setAutoUpdate"],
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
        entry: sendParent((_context, { data }: any) => ({
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
        target: "loading",
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged",
      },
    },
  },
  {
    actions: {
      refreshContext: assign(
        (
          // TODO: { basket_id, model }: CurrencyContext,
          _,
          { data: basket }: CurrencyEvent
        ) => {
          return {
            basket_id: basket?.id,
            model: basket?.currency,
          };
        }
      ),

      // @ts-ignore
      setContext: assign(
        (_context: CurrencyContext, { data }: CurrencyEvent) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }) => useModelParser(schema, model),
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined,
      }),

      setModel: assign({
        model: ({ schema, model }, { data }) => {
          const currency = get(data, "currency", data);
          return useModelParser(schema, currency || model);
        },
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
        autoupdate: (_context: any, { update }: any) => !!update,
      }),
      clearAutoUpdate: assign({
        // @ts-ignore
        autoupdate: false,
      }),

      // ---
      setFeedbackSuccess: (_context: any, _event: any) => {
        addSuccess("Successfully updated the basket currency");
      },

      setFeedbackError: ({ error }, _event) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;
        addError({
          title:
            error?.title ||
            "We experienced an error updating the basket currency",
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
      isDirty: ({ dirty }, _event) => !!dirty,
      hasBasket: ({ basket_id }, _event) => !!basket_id,
      hasChanged: ({ model, basket_id }, { data }: any) =>
        model?.id !== data?.currency_id || basket_id !== data?.id,
      shouldUpdate: ({ autoupdate, basket_id }, _event) =>
        !!autoupdate && !!basket_id,
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
