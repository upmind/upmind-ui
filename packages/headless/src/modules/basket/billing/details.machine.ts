// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, actions } from "xstate";
const { sendParent } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import { useSchema, useUischema } from "./utils";
import { useTime, useValidationParser, useModelParser } from "../../../utils";

// --- types
import type { BillingDetailsContext } from "./types";
import { responseCodes } from "../../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    // tsTypes: {} as import("./details.machine.typegen").Typegen0,
    id: "billingDetailsManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as BillingDetailsContext,
    states: {
      // Subscribe to basket changes and listen for a valid basket client,
      subscribing: {
        always: { target: "available", cond: "hasClient" },
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
        entry: ["clearError"],
        invoke: {
          src: "load",
          onDone: {
            target: "available",
            actions: ["setLookups", "setSchemas"],
          },
          onError: {
            target: "unavailable",
            actions: ["setError", "setFeedbackError"],
          },
        },
      },

      available: {
        id: "available",
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
                  onDone: {
                    target: "#valid",
                  },
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
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"],
              },
              UPDATE: {
                target: "processing",
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
            actions: ["setModel", "clearAutoUpdate"],
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
      complete: {},
    },
    on: {
      CLEAR: {
        target: "available.checking",
        actions: ["clearModel"],
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
        (_context: BillingDetailsContext, { data }: AnyEventObject) => data
      ),

      refreshContext: assign(
        (_context: BillingDetailsContext, { data }: AnyEventObject) => {
          return {
            basketId: data?.id,
            clientId: data?.client_id,
          };
        }
      ),

      setParsed: assign({
        model: (_context, { data }: AnyEventObject) => data.model,
      }),

      setLookups: assign({
        addresses: (_context, { data }: AnyEventObject) => data.addresses,
      }),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }: BillingDetailsContext) =>
          useModelParser(schema, model),
      }),

      setModel: assign({
        model: (
          { schema, model }: BillingDetailsContext,
          { data }: AnyEventObject
        ) => useModelParser(schema, data || model),
      }),

      clearModel: assign({
        model: undefined,
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }: AnyEventObject) => !!update,
      }),

      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      setFeedbackError: ({ error }: BillingDetailsContext, _event) => {
        // dont show any unauthorized errors
        if (
          !error ||
          error?.code == responseCodes.Unprocessable_Entity ||
          error?.code == responseCodes.Unauthorized
        )
          return;

        addError({
          title:
            error?.title || "We experienced an error updating billing details",
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
      // isDirty: ({ dirty }, _event) => !!dirty,
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
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services: services as any,
  }
);
