// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- utils
import { useTime, useValidationParser } from "../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { ClientItemContext } from "./types";
import { responseCodes } from "../../utils";
import { ResponseError } from "../query";

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
            actions: ["setError"],
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
                actions: ["setModel"],
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
                actions: ["setModel"],
              },
              onError: {
                target: "#error",
                actions: ["setError"],
              },
            },
          },
          removing: {
            invoke: {
              src: "remove",
              onDone: {
                target: "#processed",
                actions: ["clearModel"],
              },
              onError: {
                target: "#error",
                actions: ["setError"],
              },
            },
          },
          setting: {
            invoke: {
              src: "setDefault",
              onDone: {
                target: "#processed",
                actions: ["setModel"],
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
