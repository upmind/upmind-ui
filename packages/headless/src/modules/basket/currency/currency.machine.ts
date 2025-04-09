// --- external
import type { AnyEventObject } from "xstate";
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
import type { CurrencyContext } from "./types";
import { responseCodes } from "../../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./currency.machine.typegen").Typegen0,
    id: "basketCurrencyManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basketId: undefined,
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
            target: "#error",
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
            target: "#error",
            actions: ["setError", "setFeedbackError"],
          },
        },
      },

      processed: {
        id: "processed",
        entry: sendParent({ type: "REFRESH" }),
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
      refreshContext: assign((_context, { data: basket }: AnyEventObject) => {
        return {
          basketId: basket?.id,
          model: basket?.currency,
        };
      }),

      setContext: assign(
        (_context: CurrencyContext, { data }: AnyEventObject) => data
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
        model: (
          { schema, model }: CurrencyContext,
          { data }: AnyEventObject
        ) => {
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
        autoupdate: (_context: CurrencyContext, { update }: AnyEventObject) =>
          !!update,
      }),
      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      // ---

      setFeedbackError: ({ error }: CurrencyContext, _event) => {
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
        error: (_context, { data }: AnyEventObject) => {
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
      isDirty: ({ dirty }: CurrencyContext, _event) => !!dirty,
      hasBasket: ({ basketId }: CurrencyContext, _event) => !!basketId,
      hasChanged: (
        { model, basketId }: CurrencyContext,
        { data }: AnyEventObject
      ) => model?.id !== data?.currency_id || basketId !== data?.id,
      shouldUpdate: ({ autoupdate, basketId }: CurrencyContext, _event) =>
        !!autoupdate && !!basketId,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
