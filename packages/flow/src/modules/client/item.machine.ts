// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

// --- internal
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser } from "../../utils";

// --- types
import type { ClientItemContext, ClientItemEvent } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./item.machine.typegen").Typegen0,
    id: "clientItemManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      // ---
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: undefined
    } as ClientItemContext,
    states: {
      loading: {
        entry: ["clearError"],

        invoke: {
          src: "loadLookups",
          onDone: {
            target: "checking",
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
        id: "checking",
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
              onDone: {
                target: "#valid"
              },
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
        on: {
          UPDATE: [
            {
              target: "processing.adding",
              cond: "isNew"
            },
            {
              target: "processing.updating"
            }
          ]
        }
      },

      invalid: {
        id: "invalid"
      },

      processing: {
        entry: ["clearError"],
        states: {
          adding: {
            invoke: {
              src: "add",
              onDone: {
                target: "#processed",
                actions: ["setModel", () => addSuccess("Successfully added")]
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          },
          updating: {
            invoke: {
              src: "update",
              onDone: {
                target: "#processed",
                actions: ["setModel", () => addSuccess("Successfully updated")]
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          },
          removing: {
            invoke: {
              src: "remove",
              onDone: {
                target: "#processed",
                actions: [
                  "clearModel",
                  () => addSuccess("Successfully deleted")
                ]
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          },
          setting: {
            invoke: {
              src: "setDefault",
              onDone: {
                target: "#processed",
                actions: [
                  "setModel",
                  () => addSuccess("Successfully set as default")
                ]
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
        after: {
          wait: {
            target: "complete"
          }
        }
      },

      complete: {
        entry: sendParent("REFRESH"),
        type: "final"
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
      CLEAR: {
        target: "checking",
        actions: ["clearModel"]
      },
      SET: {
        target: "checking",
        actions: ["setModel"]
      },
      // ---
      REMOVE: {
        target: "processing.removing",
        cond: "canRemove"
      },
      DEFAULT: {
        target: "processing.setting",
        cond: "isNotDefault"
      }
    }
  },
  {
    actions: {
      setContext: assign(
        (_context: ClientItemContext, { data }: ClientItemEvent) => data
      ),

      setSchemas: assign({
        //  should be provided withConfig
      }),

      setModel: assign({
        //  should be provided withConfig
      }),

      clearModel: assign({
        model: undefined
      }),

      // ---
      setError: assign({
        error: (context, { data }) => {
          let error = data?.error;
          if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        }
      }),

      clearError: assign({ error: null }),

      setFeedbackError: ({ error }, _event) => {
        addError({
          title: error?.title || "We experienced an error with this item",
          copy: error?.message,
          data: error?.data
        });
      },

      setFeedbackSuccess: (context, { data }) =>
        addSuccess("Successfully updated")
    },
    guards: {
      isNew: ({ model }: ClientItemContext, { data }: ClientItemEvent) =>
        !model?.id,

      isNotDefault: ({ model }: ClientItemContext, { data }: ClientItemEvent) =>
        !!model?.id && !model?.default,

      canRemove: ({ model }: ClientItemContext, { data }: ClientItemEvent) =>
        !!model?.id && !!model?.can_delete
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    }
  }
);
