// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";

// --- utils
import { usePlaceSchema, usePlaceUischema, usePlaceModelParser } from "./utils";
import { useTime, useValidationParser } from "../../../utils";

// --- types
import type { PlaceContext, PlaceEvent } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./place.machine.typegen").Typegen0,
    id: "placeManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      countries: undefined,
      regions: undefined,
      types: undefined,
      // ---
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: undefined
    } as PlaceContext,
    states: {
      loading: {
        entry: ["clearError"],
        invoke: {
          src: "getPlace",
          onDone: {
            target: "idle",
            actions: ["setModel", "setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      idle: {},

      searching: {
        entry: ["clearError"],
        invoke: {
          src: "search",
          onDone: {
            target: "checking",
            actions: ["setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      checking: {
        entry: ["clearError"],
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

      processing: {
        entry: ["clearError"],
        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["setModel", "setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      processed: {
        after: {
          wait: {
            target: "complete"
          }
        }
      },

      valid: {},

      invalid: {},

      complete: {
        type: "final"
      },

      error: {
        on: {
          RETRY: {
            target: "processing"
          }
        }
      }
    },
    on: {
      SEARCH: { target: "searching" },
      UPDATE: {
        target: "processing"
      },
      CLEAR: {
        target: "idle",
        actions: ["clearModel"]
      },
      SET: {
        target: "checking",
        actions: ["setModel"]
      }
    }
  },
  {
    actions: {
      clearModel: assign({
        model: undefined
      }),

      setSchemas: assign({
        schema: (context: PlaceContext, _event: PlaceEvent) =>
          usePlaceSchema(context),
        uischema: (_context: PlaceContext, _event: PlaceEvent) =>
          usePlaceUischema()
      }),

      setModel: assign({
        model: ({ schema }: PlaceContext, { data }: PlaceEvent) =>
          usePlaceModelParser(schema, data)
      }),

      // ---
      setError: assign({
        error: (context, { data }, meta) => {
          console.log("setError", data, meta);

          let error = data?.error;
          if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error;
        }
      }),

      clearError: assign({ error: null })
    },
    guards: {},
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },
    services
  }
);
