// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

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
        invoke: {
          src: "search",
          onDone: {
            target: "checking",
            actions: ["setAutocomplete"]
          },
          onError: {
            target: "checking",
            actions: ["setError"]
          }
        }
      },

      populating: {
        invoke: {
          src: "loadPlaceDetails",
          onDone: {
            target: "checking",
            actions: ["setModel", "clearAutocomplete"]
          },
          onError: {
            target: "error",
            actions: ["setError", "clearAutocomplete"]
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
            actions: ["refresh", "setSchemas"]
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
      SEARCH: [
        { target: "populating", cond: "hasSelectedPlace" },
        { target: "searching", actions: ["setSearch"], cond: "isValidSearch" }
      ],

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

      setSearch: assign({
        autocomplete: (
          { autocomplete }: PlaceContext,
          { data }: PlaceEvent
        ) => {
          if (!autocomplete) return;
          // force the model to clear place
          set(autocomplete, "model", {
            search: data?.search,
            place: undefined
          });
          return autocomplete;
        }
      }),

      setAutocomplete: assign({
        autocomplete: (
          { autocomplete }: PlaceContext,
          { data }: PlaceEvent
        ) => {
          return {
            schema: useAutocompleteSchema(data),
            uischema: useAutocompleteUischema(data),
            results: data || [],
            model: autocomplete?.model || {}
          };
        }
      }),

      clearAutocomplete: assign({
        autocomplete: (_context: PlaceContext, _event: PlaceEvent) => ({
          schema: useAutocompleteSchema([]),
          uischema: useAutocompleteUischema([]),
          results: [],
          model: {}
        })
      }),

      // ---

      setRegions: assign({
        regions: (_context: PlaceContext, { data }: PlaceEvent) => data
      }),

      setSchemas: assign({
        schema: (context: PlaceContext, _event: PlaceEvent) =>
          usePlaceSchema(context),
        uischema: (_context: PlaceContext, _event: PlaceEvent) =>
          usePlaceUischema()
      }),

      setModel: assign({
        model: ({ schema }: PlaceContext, { data }: PlaceEvent) => data
      }),

      clearModel: assign({
        model: ({ baseModel }: PlaceContext, _event: PlaceEvent) => baseModel
      }),

      refresh: assign({
        regions: (_context: PlaceContext, { data }: PlaceEvent) => data.regions,
        model: ({ schema }: PlaceContext, { data }: PlaceEvent) =>
          usePlaceModelParser(schema, data.model)
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
      isValidSearch: ({ autocomplete }: PlaceContext, { data }: PlaceEvent) =>
        data?.search?.length > 2 &&
        autocomplete?.model?.search !== data?.search,

      hasSelectedPlace: (_context: PlaceContext, { data }: PlaceEvent) =>
        data?.place
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },
    services
  }
);
