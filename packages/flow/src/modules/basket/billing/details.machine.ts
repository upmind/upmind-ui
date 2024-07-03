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
      account_id: undefined,
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
          SESSION: { target: "checking" },
        },
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: { target: "available" },
          onError: { target: "unavailable" },
        },
      },

      unavailable: {
        on: {
          AUTHENTICATED: { target: "available" },
        },
      },

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
            id: "checking",
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
            entry: sendParent({ type: "REFRESH" }),
            after: {
              wait: {
                target: "#complete",
              },
            },
          },
        },
        on: {
          CLEAR: {
            target: "#checking",
            actions: ["clearModel", "setDirty"],
          },
          SET: {
            target: "#checking",
            actions: ["setModel", "setDirty", "setAutoUpdate"],
          },

          REFRESH: {
            actions: ["refreshBasket", "setSchemas"],
          },
        },
      },

      // ---
      error: { id: "error" },
      complete: {
        id: "complete",
        // type: "final"
      },
    },
    on: {
      UNAUTHENTICATED: {
        target: "unavailable",
        actions: ["clearError", "clearModel", "clearSchemas"],
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
            account_id: basket?.account_id,
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
      hasChanged: ({ account_id, basket_id }, { data }) => {
        return basket_id !== data?.id || account_id !== data?.account_id;
      },
      shouldUpdate: ({ autoupdate, basket_id }, _event) => {
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
