// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services, { AddressTypes } from "./services";

// --- utils
import {
  usePlaceSchema,
  usePlaceUischema,
  usePlaceModelParser,
  useAutocompleteSchema,
  useAutocompleteUischema
} from "./utils";
import { useTime, useValidationParser } from "../../../utils";
import { set } from "lodash-es";

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
      types: AddressTypes,
      baseModel: undefined,
      // ---
      autocomplete: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: undefined
    } as PlaceContext,
    states: {
      loading: {
        entry: ["clearError"],
        type: "parallel",
        states: {
          constants: {
            initial: "processing",
            states: {
              processing: {
                invoke: {
                  src: "loadConstants",
                  onDone: {
                    target: "complete",
                    actions: ["setConstants"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError"]
                  }
                }
              },
              error: {},
              complete: {
                type: "final"
              }
            }
          },
          place: {
            initial: "processing",
            states: {
              processing: {
                invoke: {
                  src: "load",
                  onDone: {
                    target: "complete",
                    actions: ["setModel"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError"]
                  }
                }
              },
              error: {},
              complete: {
                type: "final"
              }
            }
          },
          autocomplete: {
            initial: "processing",
            states: {
              processing: {
                invoke: {
                  src: "configureAutocomplete",
                  onDone: {
                    target: "complete",
                    actions: ["setAutocomplete"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError"]
                  }
                }
              },
              error: {},
              complete: {
                type: "final"
              }
            }
          }
        },
        onDone: {
          target: "checking",
          actions: "setSchemas"
        }
      },

      searching: {
        entry: ["clearError"],
        invoke: {
          src: "search",
          onDone: {
            target: "checking",
            actions: ["setAutocomplete"]
          },
          onError: {
            actions: ["setError"]
          }
        }
      },

      populating: {
        entry: ["clearError"],
        invoke: {
          src: "loadPlaceDetails",
          onDone: {
            target: "checking",
            actions: ["setModel"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

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
            actions: ["refresh", "setSchemas", "setError"]
          }
        }
      },

      processing: {
        entry: ["clearError"],
        invoke: {
          src: "save",
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
      POPULATE: { target: "populating" },
      UPDATE: {
        target: "processing"
      },
      CLEAR: {
        target: "loading",
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
      setConstants: assign({
        countries: (_context: PlaceContext, { data }: PlaceEvent) =>
          data.countries,
        regions: (_context: PlaceContext, { data }: PlaceEvent) => data.regions,
        baseModel: (_context: PlaceContext, { data }: PlaceEvent) =>
          data.baseModel
      }),

      // ---

      setAutocomplete: assign({
        autocomplete: (_context: PlaceContext, { data }: PlaceEvent) => ({
          schema: useAutocompleteSchema(data),
          uischema: useAutocompleteUischema(data),
          results: data || []
        })
      }),

      // ---

      setRegions: assign({
        regions: (_context: PlaceContext, { data }: PlaceEvent) => data
      }),

      clearModel: assign({
        model: ({ baseModel }: PlaceContext, _event: PlaceEvent) => baseModel
      }),

      setSchemas: assign({
        schema: (context: PlaceContext, _event: PlaceEvent) =>
          usePlaceSchema(context),
        uischema: (_context: PlaceContext, _event: PlaceEvent) =>
          usePlaceUischema()
      }),

      setModel: assign({
        model: ({ schema }: PlaceContext, { data }: PlaceEvent) => data
        // usePlaceModelParser(schema, data)
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
