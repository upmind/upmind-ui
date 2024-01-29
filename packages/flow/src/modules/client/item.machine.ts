// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

// --- internal

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
            actions: ["setLookups", "setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },
      // ---

      checking: {
        entry: ["clearError"],
        id: "checking",
        invoke: {
          src: "validate",
          onDone: {
            target: "valid"
          },
          onError: {
            target: "invalid",
            actions: ["setError"]
          }
        }
      },

      valid: {
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

      invalid: {},

      processing: {
        entry: ["clearError"],
        states: {
          adding: {
            invoke: {
              src: "add",
              onDone: {
                target: "#processed",
                actions: ["setModel"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          updating: {
            invoke: {
              src: "update",
              onDone: {
                target: "#processed",
                actions: ["setModel"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          removing: {
            invoke: {
              src: "remove",
              onDone: {
                target: "#processed",
                actions: ["clearModel"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          setting: {
            invoke: {
              src: "setDefault",
              onDone: {
                target: "#processed",
                actions: ["setModel"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
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
      setLookups: assign({
        // countries: (_context: AddressContext, { data }: AddressEvent) =>
        //   data.countries,
      }),

      setSchemas: assign({
        schema: (context: ClientItemContext, _event: ClientItemEvent) =>
          useSchema(context),
        uischema: (_context: ClientItemContext, _event: ClientItemEvent) =>
          useUischema()
      }),

      setModel: assign({
        model: ({ schema }: ClientItemContext, { data }: ClientItemEvent) =>
          useModelParser(schema, data)
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

      clearError: assign({ error: null })
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
