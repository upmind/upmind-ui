/** @internal */
import { createMachine, assign } from "xstate";
import {
  useTime,
  responseCodes,
  mapToHeadlessError,
  useValidationParser
} from "../../utils";
import type { DataManagerContext } from "./data-manager.types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export default createMachine<DataManagerContext>(
  {
    //tsTypes: {} as import("./item.machine.typegen").Typegen0,
    id: "dataManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as DataManagerContext,
    states: {
      // Subscribe to basket changes and listen for a valid basket client,
      subscribing: {
        entry: ["clearContext", "setSubscription"],
        always: { target: "loading", cond: "hasSubscription" },
        on: {
          REFRESH: {
            actions: ["refreshContext"],
            cond: "hasChanged"
          },
          SET: {
            actions: ["setModel", "setAutoUpdate"]
          },

          CLEAR: {
            actions: ["clearModel"]
          }
        }
      },

      loading: {
        id: "loading",
        entry: ["clearError"],
        invoke: {
          src: "loadLookups",
          onDone: {
            target: "available",
            actions: ["setContext", "setSchemas", "setMeta"]
          },
          onError: {
            target: "unavailable",
            actions: ["setError"]
          }
        }
      },

      available: {
        id: "available",
        initial: "checking",
        states: {
          checking: {
            entry: ["clearError"],
            initial: "parsing",
            states: {
              parsing: {
                invoke: {
                  src: "parse",
                  onDone: {
                    target: "validating",
                    actions: ["setParsed", "setSchemas", "setMeta"]
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
            always: { target: "#processing", cond: "shouldUpdate" },
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"]
              },
              UPDATE: {
                target: "#processing"
              }
            }
          },

          invalid: {
            id: "invalid",
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"]
              }
            }
          },

          error: {
            id: "error",
            on: {
              SET: {
                target: "checking",
                actions: ["setAutoUpdate"]
              }
            }
          }
        }
      },

      unavailable: {},

      processing: {
        id: "processing",
        entry: ["clearError"],
        initial: "validating",
        states: {
          validating: {
            invoke: {
              src: "validate",
              onDone: [
                {
                  target: "adding",
                  cond: "isNew"
                },
                {
                  target: "updating"
                }
              ],
              onError: {
                target: "#invalid",
                actions: ["setError"]
              }
            }
          },
          adding: {
            invoke: {
              src: "add",
              onDone: {
                target: "#processed",
                actions: ["setModel", "clearAutoUpdate"]
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
                actions: ["setModel", "clearAutoUpdate"]
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
          wait: [
            {
              target: "available",
              cond: "continueEditing"
            },
            {
              target: "complete"
            }
          ]
        }
      },

      complete: {
        id: "complete",
        type: "final"
      }
    },
    on: {
      CLEAR: {
        target: "available.checking",
        actions: ["clearModel"]
      },
      REFRESH: {
        target: "loading",
        actions: ["refreshContext"]
      }
    }
  },
  {
    actions: {
      setContext: assign(
        (_context: DataManagerContext, { data }: AnyEventObject) => data
      ),

      clearContext: assign(
        (_context: DataManagerContext, _: AnyEventObject) => ({})
      ),

      setSubscription: assign({
        //  should be provided withConfig
      }),

      setSchemas: assign({
        //  should be provided withConfig
      }),

      setMeta: assign({
        //  should be provided withConfig
      }),

      setModel: assign({
        //  should be provided withConfig
      }),

      setParsed: assign(
        (context: DataManagerContext, { data }: AnyEventObject) => ({
          ...context,
          ...(data ?? {})
        })
      ),

      clearModel: assign({
        model: undefined
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }: AnyEventObject) => !!update
      }),

      clearAutoUpdate: assign({
        autoupdate: false
      }),

      setError: assign({
        error: (_context: DataManagerContext, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined })
    },
    guards: {
      hasSubscription: (_context: DataManagerContext, _event: AnyEventObject) =>
        true,
      hasChanged: (_context: DataManagerContext, _event: AnyEventObject) =>
        true,
      isNew: ({ id }: DataManagerContext, _event: AnyEventObject) => !id,
      continueEditing: ({ allowMultipleEdits }) => !!allowMultipleEdits,
      shouldUpdate: ({ autoupdate }, _event) => {
        return !!autoupdate;
      }
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    }
  }
);
