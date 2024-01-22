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
      // ---
      types: [
        { key: 1, value: "home" },
        { key: 2, value: "office" },
        { key: 3, value: "holiday" }
      ],
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
        initial: "constants",
        states: {
          constants: {
            invoke: {
              src: "loadConstants",
              onDone: {
                target: "place",
                actions: ["setConstants"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          place: {
            invoke: {
              src: "load",
              onDone: {
                target: "#idle",
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

      idle: {
        id: "idle"
      },

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
            target: "valid",
            actions: ["refresh", "setSchemas"]
          },
          onError: {
            target: "invalid",
            actions: ["refresh", "setSchemas", "setError"]
          }
        }
      },

      processing: {
        entry: ["clearError"],
        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["setSchemas", "setModel"]
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
        id: "error",
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
        target: "loading",
        actions: ["clearModel"]
      },
      SET: {
        target: "checking"
      }
    }
  },
  {
    actions: {
      setConstants: assign({
        countries: (_context: PlaceContext, { data }: PlaceEvent) =>
          data.countries,
        regions: (_context: PlaceContext, { data }: PlaceEvent) => data.regions
      }),

      setRegions: assign({
        regions: (_context: PlaceContext, { data }: PlaceEvent) => data
      }),

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

      refresh: assign({
        regions: (_context: PlaceContext, { data }: PlaceEvent) => data.regions,
        model: ({ schema }: PlaceContext, { data }: PlaceEvent) =>
          usePlaceModelParser(schema, data.model)
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

          return error || data;
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
