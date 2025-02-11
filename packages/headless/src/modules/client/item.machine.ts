// --- external
import { createMachine, assign, actions } from "xstate";
const { sendParent } = actions;

// --- internal
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { isString } from "lodash-es";
import { useTime, useValidationParser } from "../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { ClientItemContext } from "./types";
import { responseCodes } from "../api";

// -----------------------------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./item.machine.typegen").Typegen0,
    id: "clientItemManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      title: undefined,
      description: undefined,
      // ---
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: undefined,
    } as ClientItemContext,
    states: {
      loading: {
        entry: ["clearError"],

        invoke: {
          src: "loadLookups",
          onDone: {
            target: "checking",
            actions: ["setContext", "setSchemas", "setMeta"],
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
            actions: ["setModel"],
          },
          UPDATE: [
            {
              target: "processing.adding",
              cond: "isNew",
            },
            {
              target: "processing.updating",
            },
          ],
        },
      },

      invalid: {
        id: "invalid",
        on: {
          SET: {
            target: "checking",
            actions: ["setModel"],
          },
        },
      },

      processing: {
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
          removing: {
            invoke: {
              src: "remove",
              onDone: {
                target: "#processed",
                actions: [
                  "clearModel",
                  (context, _event) => {
                    addSuccess(`Successfully deleted ${context.title}`);
                  },
                ],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
          setting: {
            invoke: {
              src: "setDefault",
              onDone: {
                target: "#processed",
                actions: [
                  "setModel",
                  (context, _event) => {
                    addSuccess(`Successfully set ${context.title} as default`);
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
        entry: [
          sendParent(
            ({ model }: ClientItemContext, _event: AnyEventObject) => ({
              type: "REFRESH",
              data: model?.id,
            })
          ),
        ],
        type: "final",
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
      CLEAR: {
        target: "checking",
        actions: ["clearModel"],
      },

      // ---
      REMOVE: {
        target: "processing.removing",
        cond: "canRemove",
      },
      DEFAULT: {
        target: "processing.setting",
        cond: "isNotDefault",
      },
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
      isNew: ({ model }: ClientItemContext, _event: AnyEventObject) =>
        !model?.id,

      isNotDefault: ({ model }: ClientItemContext, _event: AnyEventObject) =>
        !!model?.id && !model?.default,

      canRemove: ({ model }: ClientItemContext, _event: AnyEventObject) =>
        !!model?.id && !!model?.canDelete,
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
  }
);
