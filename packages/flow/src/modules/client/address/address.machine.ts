// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent, pure } = actions;

// --- internal
import { useFeedback } from "../../feedback";
const { addError, addSuccess } = useFeedback();
import services, { AddressTypes } from "./services";

// --- utils
import {
  useSchema,
  useUischema,
  useModelParser,
  useAutocompleteSchema,
  useAutocompleteUischema
} from "./utils";
import { useTime, useValidationParser } from "../../../utils";
import { set, get, find, compact } from "lodash-es";

// --- types
import type { AddressContext, AddressEvent } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./address.machine.typegen").Typegen0,
    id: "addressManager",
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
    } as AddressContext,
    states: {
      loading: {
        entry: ["clearError"],
        type: "parallel",
        states: {
          lookups: {
            initial: "processing",
            states: {
              processing: {
                invoke: {
                  src: "loadLookups",
                  onDone: {
                    target: "complete",
                    actions: ["setContext"]
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
          src: "getPlaceDetails",
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

      processing: {
        entry: ["clearError"],
        states: {
          adding: {
            invoke: {
              src: "add",
              onDone: {
                target: "#processed",
                actions: [
                  "setSchemas",
                  "setModel",
                  pure((context, event) => {
                    addSuccess(`Successfully added ${context.title}`);
                  })
                ]
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
                actions: [
                  "setSchemas",
                  "setModel",
                  pure((context, event) => {
                    addSuccess(`Successfully updated ${context.title}`);
                  })
                ]
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
                  "setSchemas",
                  "clearModel",
                  pure((context, event) => {
                    addSuccess(`Successfully deleted ${context.title}`);
                  })
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
                  "setSchemas",
                  "setModel",
                  pure((context, event) => {
                    addSuccess(`Successfully set ${context.title} as default`);
                  })
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

      complete: {
        entry: sendParent(
          ({ model }: ClientItemContext, event: ClientItemEvent) => ({
            data: model?.id,
            type: "REFRESH"
          })
        ),
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
        { target: "populating", cond: "hasSelectedAddress" },
        { target: "searching", actions: ["setSearch"], cond: "isValidSearch" }
      ],
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
        (_context: AddressContext, { data }: AddressEvent) => data
      ),

      // ---

      setSearch: assign({
        autocomplete: (
          { autocomplete }: AddressContext,
          { data }: AddressEvent
        ) => {
          if (!autocomplete) return;
          // force the model to clear address
          set(autocomplete, "model", {
            search: data?.search,
            place: undefined
          });
          return autocomplete;
        }
      }),

      setAutocomplete: assign({
        autocomplete: (
          { autocomplete }: AddressContext,
          { data }: AddressEvent
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
        autocomplete: (_context: AddressContext, _event: AddressEvent) => ({
          schema: useAutocompleteSchema([]),
          uischema: useAutocompleteUischema([]),
          results: [],
          model: {}
        })
      }),

      // ---

      setRegions: assign({
        regions: (_context: AddressContext, { data }: AddressEvent) => data
      }),

      setSchemas: assign({
        schema: (context: AddressContext, _event: AddressEvent) =>
          useSchema(context),
        uischema: (context: AddressContext, _event: AddressEvent) =>
          useUischema(context),
        title: ({ model }: AddressContext, _event: AddressEvent) => model?.name,
        description: (
          { model, countries, regions }: AddressContext,
          _event: AddressEvent
        ) => {
          const country = find(countries, ["id", get(model, "country_id")]);
          const region = find(regions, ["id", get(model, "region_id")]);
          return compact([
            get(model, "address_1"),
            get(model, "address_2"),
            get(model, "street"),
            get(model, "city"),
            get(model, "postcode"),
            get(region, "name"),
            get(country, "name")
          ]).join(", ");
        }
      }),

      setModel: assign({
        model: ({ schema }: AddressContext, { data }: AddressEvent) => data
      }),

      clearModel: assign({
        model: ({ baseModel }: AddressContext, _event: AddressEvent) =>
          baseModel
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
      }
    },
    guards: {
      isValidSearch: (
        { autocomplete }: AddressContext,
        { data }: AddressEvent
      ) =>
        data?.search?.length > 2 &&
        autocomplete?.model?.search !== data?.search,

      hasSelectedAddress: (_context: AddressContext, { data }: AddressEvent) =>
        data?.place,

      isNew: ({ model }: AddressContext, { data }: AddressEvent) => !model?.id,

      isNotDefault: ({ model }: AddressContext, { data }: AddressEvent) =>
        !!model?.id && !model?.default,

      canRemove: ({ model }: AddressContext, { data }: AddressEvent) =>
        !!model?.id && !!model?.can_delete
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },
    services
  }
);
