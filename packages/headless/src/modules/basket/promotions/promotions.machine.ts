// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, actions, sendParent } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils

import { useTime, useValidationParser, useModelParser } from "../../../utils";
import { useSchema, useUischema } from "./utils";
import { remove, xorBy, get, includes, isEmpty } from "lodash-es";

// --- types
import type { PromotionsContext } from "./types";
import { responseCodes } from "../../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./promotions.machine.typegen").Typegen0,
    id: "basketPromotionsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basketId: undefined,
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
                target: "#error",
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
        },
      },

      processed: {
        id: "processed",
        entry: "refreshBasket",
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
        actions: ["removePromo"],
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
        (_context: PromotionsContext, { data: basket }: AnyEventObject) => {
          return {
            basketId: basket?.id,
            promotions: basket?.promotions,
          };
        }
      ),

      // NB: send the data (basket) to the parent so theres no lag in showing/removing the tags
      refreshBasket: sendParent((_context, { data }: any) => {
        return {
          type: "REFRESH",
          data,
        };
      }),

      setContext: assign(
        (_context: PromotionsContext, { data }: AnyEventObject) => data
      ),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }) => {
          if (!schema) return model;
          return useModelParser(schema, model);
        },
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined,
      }),

      setModel: assign({
        model: ({ schema, model }, { data }: AnyEventObject) => {
          if (!schema) return data ?? model;
          return useModelParser(schema, data ?? model);
        },
      }),

      clearModel: assign({
        model: undefined,
      }),

      removePromo: assign({
        promotions: ({ promotions }, { data }: AnyEventObject) => {
          const id = get(data, "id", data);
          if (promotions?.length && id) {
            remove(promotions, ["id", id]);
          }
          return promotions;
        },
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

      setFeedbackError: ({ error }, _event) => {
        if (!error || error.code < 500) return;

        addError({
          title:
            error?.title ||
            "We experienced an error updating the basket promotions",
          copy: error?.message,
          data: error?.data,
        });
      },

      setError: assign({
        error: (_context, { data }: any) => {
          let error = data?.error;
          if (
            includes(
              [responseCodes.Unprocessable_Entity, responseCodes.Conflict],
              error?.code
            )
          ) {
            if (isEmpty(error?.data)) {
              // ensure we have a valid error object
              error.data = { promocode: [error?.message] };
            }
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
      isDirty: ({ dirty, model }, _event) =>
        !!dirty && !isEmpty(model?.promocode),
      hasBasket: ({ basketId }, _event) => !!basketId,
      hasChanged: ({ promotions, basketId }, { data }: any) =>
        !!xorBy(promotions, data?.promotions, "id")?.length ||
        basketId !== data?.id,
      shouldUpdate: ({ autoupdate, basketId }, _event) =>
        !!autoupdate && !!basketId,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
