// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, actions, sendParent } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import { useSchema, useUischema } from "./utils";
import { useTime, useValidationParser, useModelParser } from "../../../utils";

// --- types
import type { BillingContext } from "./types";
import { responseCodes } from "../../../utils";

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
            cond: "hasChanged",
          },
          SET: {
            actions: ["setModel", "setDirty", "setAutoUpdate"],
          },

          CLEAR: {
            actions: ["clearModel", "clearDirty"],
          },
        },
      },

      loading: {
        id: "loading",
        entry: ["clearError"],
        invoke: {
          src: "loadLookups",
          onDone: {
            target: "available",
            actions: ["setContext", "setSchemas"],
          },
          onError: {
            target: "unavailable",
            actions: ["setError", "setFeedbackError"],
          },
        },
      },

      available: {
        initial: "checking",
        states: {
          checking: {
            entry: ["clearError"],
            initial: "parsing",
            states: {
              parsing: {
                invoke: {
                  src: "parse",
                  onDone: {
                    target: "validating",
                    actions: ["setParsed", "setSchemas"],
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
            always: { target: "#processing", cond: "shouldUpdate" },
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"],
              },
              UPDATE: {
                target: "#processing",
                cond: "hasBasket",
              },
            },
          },

          invalid: {
            id: "invalid",
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"],
              },
            },
          },

          error: {
            id: "error",
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"],
              },
            },
          },
        },
      },

      unavailable: {},

      processing: {
        id: "processing",
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
      },
    },
    on: {
      CLEAR: {
        target: "available.checking",
        actions: ["clearModel", "setDirty"],
      },
      REFRESH: {
        target: "available.checking",
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged",
      },
    },
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
          };
        }
      ),

      setParsed: assign({
        model: (_context, { data }: AnyEventObject) => data.model,
        autoupdate: (_context, { data }: AnyEventObject) => data.autoupdate,
        dirty: (_context, { data }: AnyEventObject) => data.dirty,
      }),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }: BillingContext) => {
          if (!schema) return model;
          return useModelParser(schema, model);
        },
      }),

      setModel: assign({
        model: (
          { schema, model }: BillingContext,
          { data }: AnyEventObject
        ) => {
          if (!schema) return data ?? model;
          return useModelParser(schema, data ?? model);
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
        autoupdate: (_context, { update }: AnyEventObject) => !!update,
      }),

      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      // ---

      setFeedbackError: ({ error }: BillingContext, _event) => {
        // dont show any unauthorized errors
        if (
          !error ||
          error?.status == responseCodes.Unprocessable_Entity ||
          error?.status == responseCodes.Unauthorized
        )
          return;

        addError({
          title: "We experienced an error updating billing details",
          copy: error?.message,
          data: error?.data,
        });
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          let error = data?.error;
          if (data?.status == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        },
      }),

      clearError: assign({ error: undefined }),
    },

    guards: {
      isDirty: ({ dirty }, _event) => !!dirty,
      hasBasket: ({ basketId }, _event) => !!basketId,
      hasClient: ({ clientId }, _event) => !!clientId,
      hasChanged: ({ clientId, basketId }, { data }: AnyEventObject) => {
        // NB data is raw basket data so use snake_case for comparison
        return basketId !== data?.id || clientId !== data?.client_id;
      },
      shouldUpdate: ({ autoupdate, clientId, basketId, model }, _event) => {
        return !!autoupdate && !!basketId && !!clientId && !!model?.addressId;
      },
    },

    delays: {
      // error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services: services as any,
  }
);
