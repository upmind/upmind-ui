// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

// --- internal
import services from "./services";

// --- utils
import { useSchema, useUischema, useModelParser } from "./utils";
import { useTime, useValidationParser } from "../../utils";

// --- types
import type { CompanyContext, CompanyEvent } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./company.machine.typegen").Typegen0,
    id: "companyManager",
    predictableActionArguments: true,
    initial: "checking",
    context: {
      // ---
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: undefined
    } as CompanyContext,
    states: {
      // ---

      checking: {
        id: "checking",
        entry: ["clearError"],
        invoke: {
          src: "validate",
          onDone: {
            target: "valid",
            actions: ["refresh", "setSchemas"]
          },
          onError: {
            target: "invalid",
            actions: ["refresh", "setSchemas"]
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
                actions: ["setSchemas", "setModel"]
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
                actions: ["setSchemas", "setModel"]
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
                actions: ["setSchemas", "clearModel"]
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
                actions: ["setSchemas", "setModel"]
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
      setSchemas: assign({
        schema: (context: CompanyContext, _event: CompanyEvent) =>
          useSchema(context),
        uischema: (_context: CompanyContext, _event: CompanyEvent) =>
          useUischema()
      }),

      setModel: assign({
        model: ({ schema }: CompanyContext, { data }: CompanyEvent) => data
      }),

      clearModel: assign({
        model: undefined
      }),

      refresh: assign({
        model: ({ schema }: CompanyContext, { data }: CompanyEvent) =>
          useModelParser(schema, data.model)
      }),

      // ---
      setError: assign({
        error: (context, { data }, meta) => {
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
      isNew: ({ model }: CompanyContext, { data }: CompanyEvent) => !model?.id,

      isNotDefault: ({ model }: CompanyContext, { data }: CompanyEvent) =>
        !!model?.id && !model?.default,

      canRemove: ({ model }: CompanyContext, { data }: CompanyEvent) =>
        !!model?.id && !!model?.can_delete
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },
    services
  }
);
