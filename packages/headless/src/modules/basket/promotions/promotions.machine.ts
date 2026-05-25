// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";

// --- utils
import {
  useTime,
  parseError,
  useModelParser,
  mapToHeadlessError,
  useValidationParser,
  isDirty
} from "../../../utils";
import { responseCodes } from "../../../utils";
import { useSchema, useUischema } from "./utils";
import { remove, xorBy, get, isEmpty } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { PromotionsContext, PromotionModel } from "./types";
import { useI18n } from "../../system";
import { parsePromotionDetails } from "./utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./promotions.machine.typegen").Typegen0,
    id: "basketPromotionsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as PromotionsContext,
    states: {
      loading: {
        entry: ["clearError"],
        invoke: {
          src: "load",
          onDone: {
            target: "complete",
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
          ADD: {
            target: "processing"
          },
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
        initial: "update",
        states: {
          update: {
            invoke: {
              src: "add",
              onDone: {
                target: "#processed",
                actions: ["clearAutoUpdate", "clearModel"]
              },
              onError: {
                target: "#error",
                actions: ["setError", "clearAutoUpdate", "setFeedbackError"]
              }
            }
          },
          remove: {
            invoke: {
              src: "remove",
              onDone: {
                target: "#processed"
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          }
        }
      },

      processed: {
        id: "processed",
        entry: ["prefreshBasket", "refreshBasket"],
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
      REMOVE: {
        target: "processing.remove",
        actions: ["removePromo"]
      },
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
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged"
      }
    }
  },
  {
    actions: {
      refreshContext: assign(
        (_context: PromotionsContext, { data: basket }: AnyEventObject) => {
          return {
            basketId: basket?.id,
            promotions: parsePromotionDetails(basket?.promotions ?? [])
          };
        }
      ),

      // NB: send PREFRESH with data first for immediate UI update, then REFRESH for full refresh
      prefreshBasket: sendParent(
        (_context: PromotionsContext, { data }: AnyEventObject) => {
          return {
            type: "PREFRESH",
            data
          };
        }
      ),

      refreshBasket: sendParent({ type: "REFRESH" }),

      setContext: assign(
        (_context: PromotionsContext, { data }: AnyEventObject) => data
      ),

      setSchemas: assign({
        schema: (context: PromotionsContext) => useSchema(context),
        uischema: (context: PromotionsContext) => useUischema(context),
        model: ({ schema, model }) => {
          if (!schema) return model;
          return useModelParser<PromotionModel>(schema, model);
        }
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: (
          { schema, model }: PromotionsContext,
          { data }: AnyEventObject
        ) => {
          if (!schema) return data ?? model;
          return useModelParser<PromotionModel>(schema, data ?? model);
        }
      }),

      clearModel: assign({
        model: undefined
      }),

      removePromo: assign({
        promotions: (
          { promotions }: PromotionsContext,
          { data }: AnyEventObject
        ) => {
          const id = get(data, "id", data);
          if (promotions?.length && id) {
            remove(promotions, ["id", id]);
          }
          return promotions;
        }
      }),

      setAutoUpdate: assign({
        autoupdate: (_context: PromotionsContext, { update }: AnyEventObject) =>
          !!update
      }),
      clearAutoUpdate: assign({
        autoupdate: false
      }),

      // ---

      setFeedbackError: (
        { error }: PromotionsContext,
        _event: AnyEventObject
      ) => {
        const { t } = useI18n();
        if (!error || error.status < 500) return;

        useFeedback().addError({
          title: t("error.promotion_update_failed"),
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context: PromotionsContext, { data }: AnyEventObject) => {
          let error = mapToHeadlessError(data);

          if (
            error?.status == responseCodes.Unprocessable_Entity ||
            error?.status == responseCodes.Conflict
          ) {
            if (isEmpty(error?.data)) {
              // ensure we have a valid error object
              error.data = parseError(error?.message, "promocode");
            } else {
              error.data = useValidationParser(error);
            }
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      isDirty: ({ baseModel, model }, _event) =>
        isDirty(model, baseModel) && !isEmpty(model?.promocode),
      hasBasket: ({ basketId }, _event) => !!basketId,
      hasChanged: ({ promotions, basketId }, { data }: AnyEventObject) =>
        !!xorBy(promotions, data?.promotions, "id")?.length ||
        basketId !== data?.id,
      shouldUpdate: ({ autoupdate, basketId }, _event) =>
        !!autoupdate && !!basketId
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
