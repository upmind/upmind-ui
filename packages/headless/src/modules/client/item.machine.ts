// --- external
import { createMachine, assign } from "xstate";

// --- utils
import { responseCodes } from "../../utils";
import { useTime, useValidationParser } from "../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { ClientItemContext } from "./types";

// -----------------------------------------------------------------------------

export default createMachine<ClientItemContext>(
  {
    //tsTypes: {} as import("./item.machine.typegen").Typegen0,
    id: "clientManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as ClientItemContext,
    states: {
      // Subscribe to basket changes and listen for a valid basket client,
      subscribing: {
        entry: ["clearContext", "setSubscription"],
        always: { target: "loading", cond: "hasSubscription" },
        on: {
          REFRESH: {
            actions: ["refreshContext"],
            cond: "hasChanged",
          },
          SET: {
            actions: ["setModel", "setAutoUpdate"],
          },

          CLEAR: {
            actions: ["clearModel"],
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
            actions: ["setContext", "setSchemas", "setMeta"],
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
                    actions: ["setParsed", "setSchemas", "setMeta"],
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
            always: { target: "#processing", cond: "shouldUpdate" },
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"],
              },
              UPDATE: [
                {
                  target: "#processing.adding",
                  cond: "isNew",
                },
                {
                  target: "#processing.updating",
                },
              ],
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
        states: {
          adding: {
            invoke: {
              src: "add",
              onDone: {
                target: "#processed",
                actions: ["setModel", "clearAutoUpdate"],
              },
              onError: {
                target: "#error",
                actions: ["setError"],
              },
            },
          },
          updating: {
            invoke: {
              src: "update",
              onDone: {
                target: "#processed",
                actions: ["setModel", "clearAutoUpdate"],
              },
              onError: {
                target: "#error",
                actions: ["setError"],
              },
            },
          },
        },
      },

      processed: {
        id: "processed",
        after: {
          wait: [
            {
              target: "available",
              cond: "continueEditing",
            },
            {
              target: "complete",
            },
          ],
        },
      },

      complete: {
        id: "complete",
        type: "final",
      },
    },
    on: {
      CLEAR: {
        target: "available.checking",
        actions: ["clearModel"],
      },
      REFRESH: {
        target: "loading",
      },
    },
  },
  {
    actions: {
      setContext: assign(
        (_context: ClientItemContext, { data }: AnyEventObject) => data
      ),

      clearContext: assign(
        (_context: ClientItemContext, { data }: AnyEventObject) => ({})
      ),

      setSubscription: assign({
        //  should be provided withConfig
      }),

      setSchemas: assign({
        //  should be provided withConfig
      }),

      setMeta: assign({
        //  should be provided withConfig
      }),

      setModel: assign({
        //  should be provided withConfig
      }),

      setParsed: assign(
        (context: ClientItemContext, { data }: AnyEventObject) => ({
          ...context,
          ...(data ?? {}),
        })
      ),

      clearModel: assign({
        model: undefined,
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }: AnyEventObject) => !!update,
      }),

      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      setError: assign({
        error: (_context: ClientItemContext, { data }: AnyEventObject) => {
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
      hasSubscription: (_context: ClientItemContext, _event: AnyEventObject) =>
        true,
      hasChanged: (_context: ClientItemContext, _event: AnyEventObject) => true,
      isNew: ({ id }: ClientItemContext, _event: AnyEventObject) => !id,
      continueEditing: ({ allowMultipleEdits }) => !!allowMultipleEdits,
      shouldUpdate: ({ autoupdate }, _event) => {
        return !!autoupdate;
      },
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
  }
);
