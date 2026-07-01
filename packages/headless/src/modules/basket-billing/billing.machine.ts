/** @internal */
import { assign, sendParent, createMachine } from "xstate";
import { useFeedback } from "../feedback";
import { useI18n } from "../system-localisation";
import { useSchema, useUischema } from "./basket-billing.schema";
import services from "./basket-billing.services";
import {
  useTime,
  useModelParser,
  mapToHeadlessError,
  useValidationParser,
  isDirty
} from "../../utils";
import { responseCodes } from "../../utils";
import type { BillingContext } from "./basket-billing.types";
import type { ResponseError } from "../../utils";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    // tsTypes: {} as import("./details.machine.typegen").Typegen0,
    id: "billingManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as BillingContext,
    states: {
      // Subscribe to basket changes and listen for a valid basket client,
      subscribing: {
        always: { target: "loading", cond: "hasClient" },
        on: {
          REFRESH: {
            actions: ["refreshContext"],
            cond: "hasChanged"
          },
          SET: {
            actions: ["setModel", "setAutoUpdate"]
          },

          CLEAR: {
            actions: ["clearModel"]
          }
        }
      },

      loading: {
        id: "loading",
        entry: ["clearError"],
        invoke: {
          src: "loadLookups",
          onDone: {
            target: "available",
            actions: ["setContext", "setSchemas"]
          },
          onError: {
            target: "unavailable",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },

      available: {
        initial: "checking",
        states: {
          waiting: {
            on: {
              RESUME: {
                target: "checking"
              },
              SET: {
                target: "checking",
                actions: ["setModel", "setAutoUpdate"]
              }
            }
          },

          checking: {
            entry: ["clearError"],
            initial: "parsing",
            on: {
              SET: {
                target: "checking",
                actions: ["setModel", "setAutoUpdate"]
              }
            },
            states: {
              parsing: {
                invoke: {
                  src: "parse",
                  onDone: {
                    target: "validating",
                    actions: ["setParsed", "setSchemas"]
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
            always: { target: "#processing", cond: "shouldUpdate" },
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"]
              },
              UPDATE: {
                target: "#processing",
                cond: "hasBasket"
              }
            }
          },

          invalid: {
            id: "invalid",
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"]
              }
            }
          }
        }
      },

      processing: {
        id: "processing",
        entry: ["clearError"],

        invoke: {
          src: "update",
          onDone: {
            target: "#processed",
            actions: ["persistModel", "clearAutoUpdate"]
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
          sendParent((_ctx: BillingContext, { data }: AnyEventObject) => ({
            type: "PREFRESH",
            data
          })),
          sendParent({ type: "REFRESH" })
        ],
        after: {
          wait: {
            target: "#complete"
          }
        }
      },

      error: {
        id: "error",
        on: {
          SET: {
            target: "available.checking",
            actions: ["setAutoUpdate"]
          }
        }
      },

      unavailable: {},

      complete: {
        id: "complete",
        on: {
          SET: {
            target: "available",
            actions: ["setAutoUpdate"]
          }
        }
      }
    },
    on: {
      CLEAR: {
        target: "available.checking",
        actions: ["clearModel"]
      },
      REFRESH: {
        target: "available.checking",
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged"
      },
      WAIT: {
        target: "available.waiting"
      }
    }
  },
  {
    actions: {
      setContext: assign(
        (_context: BillingContext, { data }: AnyEventObject) => data
      ),

      refreshContext: assign(
        (_context: BillingContext, { data }: AnyEventObject) => {
          return {
            basketId: data?.id,
            clientId: data?.client_id,
            model: {
              addressId: data?.address_id,
              companyId: data?.company_id,
              phoneId: data?.phone_id
            }
          };
        }
      ),

      setParsed: assign({
        model: (_context, { data }: AnyEventObject) => data.model,
        autoupdate: (_context, { data }: AnyEventObject) => data.autoupdate
      }),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }: BillingContext) => {
          if (!schema) return model;
          return useModelParser(schema, model);
        }
      }),

      setModel: assign({
        model: (
          { schema, model }: BillingContext,
          { data }: AnyEventObject
        ) => {
          if (!schema) return data ?? model;
          return useModelParser(schema, data ?? model);
        }
      }),

      // persist the model as the new base model
      persistModel: assign({
        model: (_context: BillingContext, { data }: AnyEventObject) => ({
          addressId: data?.address_id,
          companyId: data?.company_id,
          phoneId: data?.phone_id
        }),
        baseModel: (_context: BillingContext, { data }: AnyEventObject) => ({
          addressId: data?.address_id,
          companyId: data?.company_id,
          phoneId: data?.phone_id
        })
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

      // ---

      setFeedbackError: (context: BillingContext, _event) => {
        const { t } = useI18n();
        const error = context.error as ResponseError;
        // dont show any unauthorized errors
        if (
          !error ||
          error?.status == responseCodes.Unprocessable_Entity ||
          error?.status == responseCodes.Unauthorized
        )
          return;

        useFeedback().addError({
          title: t("error.billing_details_update_failed"),
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
      isDirty: ({ baseModel, model }, _event) => isDirty(baseModel, model),
      hasBasket: ({ basketId }, _event) => !!basketId,
      hasClient: ({ clientId }, _event) => !!clientId,
      hasChanged: ({ clientId, basketId }, { data }: AnyEventObject) => {
        // NB data is raw basket data so use snake_case for comparison
        return basketId !== data?.id || clientId !== data?.client_id;
      },
      shouldUpdate: ({ autoupdate, clientId, basketId, model }, _event) => {
        return !!autoupdate && !!basketId && !!clientId && !!model?.addressId;
      }
    },

    delays: {
      // error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services: services as any
  }
);
