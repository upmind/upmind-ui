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

// --- types
import type { BillingDetailsContext, BillingDetailsEvent } from "./types.d";
import { responseCodes } from "../../api";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./details.machine.typegen").Typegen0,
    id: "billingDetailsManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      basket_id: undefined,
      client_id: undefined,
      // ---
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      dirty: false,
      error: null,
      autoupdate: false,
    } as BillingDetailsContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        invoke: {
          id: "authCallback",
          src: "authSubscription",
        },
        on: {
          AUTHENTICATED: { target: "checking" },
        },
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: { target: "available" },
          onError: { target: "unavailable" },
        },
      },

      unavailable: {},

      available: {
        initial: "loading",
        states: {
          loading: {
            id: "loading",
            entry: ["clearError"],
            invoke: {
              src: "load",
              onDone: {
                target: "checking",
                actions: ["setLookups", "setSchemas"],
              },
              onError: {
                target: "#error",
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
            entry: sendParent((_context, { data }) => ({
              type: "REFRESH",
              data,
            })),
            after: {
              wait: {
                target: "#complete",
              },
            },
          },
        },
        on: {
          CLEAR: {
            target: "available.checking",
            actions: ["clearModel", "setDirty"],
          },
          SET: {
            target: "available.checking",
            actions: ["setModel", "setDirty", "setAutoUpdate"],
          },
        },
      },

      // ---
      error: { id: "error" },
      complete: {
        id: "complete",
        on: {
          CLEAR: {
            target: "available.checking",
            actions: ["clearModel", "setDirty"],
          },
          SET: {
            target: "available.checking",
            actions: ["setModel", "setDirty", "setAutoUpdate"],
          },
        },
        // type: "final"
      },
    },
    on: {
      UNAUTHENTICATED: {
        target: "subscribing",
        actions: ["clearError", "clearModel", "clearSchemas"],
      },
      REFRESH: {
        target: "available.checking",
        actions: ["refreshBasket", "setSchemas"],
      },
    },
  },
  {
    actions: {
      refreshBasket: assign(
        (
          _context: BillingDetailsContext,
          { data: basket }: BillingDetailsEvent
        ) => {
          return {
            basket_id: basket?.id,
            client_id: basket?.client_id,
            model: {
              address_id: basket?.address_id,
              company_id: basket?.company_id,
            },
          };
        }
      ),

      setParsed: assign({
        model: (_context, { data }) => data.model,
      }),

      setLookups: assign({
        addresses: (_context, { data }) => data.addresses,
        companies: (_context, { data }) => data.companies,
      }),

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
        addSuccess("Successfully updated billing details");
      },

      setFeedbackError: ({ error }, _event) => {
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
        error: (_context, { data }) => {
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
      hasChanged: ({ client_id, basket_id }, { data }) => {
        return basket_id !== data?.id || client_id !== data?.client_id;
      },
      shouldUpdate: ({ autoupdate, basket_id, model }, _event) => {
        return !!autoupdate && !!basket_id && !!model?.address_id;
      },
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
