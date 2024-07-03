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
import { xorBy } from "lodash-es";

// --- types
import type { PromotionsContext, PromotionsEvent } from "./types.d";
import { responseCodes } from "../../api";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./promotions.machine.typegen").Typegen0,
    id: "basketPromotionsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basket_id: undefined,
      promotions: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      dirty: false,
      error: null,
      autoupdate: false,
    } as PromotionsContext,
    states: {
      loading: {
        entry: ["clearError"],
        invoke: {
          src: "load",
          onDone: {
            target: "complete",
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
              onError: [
                {
                  target: "#invalid",
                  actions: ["setError"],
                  cond: "isDirty",
                },
                {
                  target: "#complete",
                },
              ],
            },
          },
        },
      },

      valid: {
        id: "valid",
        always: { target: "processing", cond: "shouldUpdate" },

        on: {
          ADD: {
            target: "processing",
          },
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
        initial: "update",
        states: {
          update: {
            invoke: {
              src: "add",
              onDone: {
                target: "#processed",
                actions: ["setModel", "clearDirty", "clearAutoUpdate"],
              },
              onError: {
                target: "error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
          remove: {
            invoke: {
              src: "remove",
              onDone: {
                target: "#processed",
                actions: ["setModel", "clearDirty"],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
          error: {
            after: {
              error: "#invalid",
            },
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
      REMOVE: {
        target: "processing.remove",
      },
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
        (_context: PromotionsContext, { data: basket }: PromotionsEvent) => {
          return {
            basket_id: basket?.id,
            promotions: basket?.promotions,
          };
        }
      ),

      setContext: assign(
        (_context: PromotionsContext, { data }: PromotionsEvent) => data
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
        addSuccess("Successfully updated the basket promotions");
      },

      setFeedbackError: ({ error }, _event) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;

        addError({
          title:
            error?.title ||
            "We experienced an error updating the basket promotions",
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
      hasChanged: ({ promotions, basket_id }, { data }) =>
        !!xorBy(promotions, data?.promotions, "id")?.length ||
        basket_id !== data?.id,
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
