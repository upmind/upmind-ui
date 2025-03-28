// --- external
import { createMachine, assign, actions, log } from "xstate";

// --- internal
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { isString } from "lodash-es";
import { useTime, useValidationParser } from "../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { ClientItemContext } from "./types";
import { responseCodes } from "../../utils";

// -----------------------------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./item.machine.typegen").Typegen0,
    id: "clientManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as ClientItemContext,
    states: {
      loading: {
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
                    actions: ["setContext", "setSchemas", "setMeta"],
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
            on: {
              SET: {
                target: "checking",
                actions: log((_context, { data }: AnyEventObject) => data),
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
                actions: log((_context, { data }: AnyEventObject) => data),
              },
            },
          },
          error: {
            id: "error",
            on: {
              SET: {
                target: "checking",
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
                actions: [
                  "setModel",
                  (context, _event) => {
                    addSuccess(`Successfully added ${context.title}`);
                  },
                ],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
          updating: {
            invoke: {
              src: "update",
              onDone: {
                target: "#processed",
                actions: [
                  "setModel",
                  (context, _event) => {
                    addSuccess(`Successfully updated ${context.title}`);
                  },
                ],
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
        after: {
          wait: {
            target: "complete",
          },
        },
      },

      complete: {
        type: "final",
      },
    },
    on: {
      CLEAR: {
        target: "available.checking",
        actions: ["clearModel"],
      },

      // ---
    },
  },
  {
    actions: {
      setContext: assign(
        (_context: ClientItemContext, { data }: AnyEventObject) => data
      ),

      setSchemas: assign({
        //  should be provided withConfig
      }),

      setMeta: assign({
        //  should be provided withConfig
      }),

      setModel: assign({
        //  should be provided withConfig
      }),

      clearModel: assign({
        model: undefined,
      }),

      // ---
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

      setFeedbackError: (
        { error }: ClientItemContext,
        _event: AnyEventObject
      ) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;
        addError({
          title: isString(error)
            ? error
            : error?.title || "We experienced an error with this item",
          copy: error?.message,
          data: error?.data,
        });
      },
    },
    guards: {
      isNew: ({ id }: ClientItemContext, _event: AnyEventObject) => !id,
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
  }
);
