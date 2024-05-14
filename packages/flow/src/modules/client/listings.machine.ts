// --- external
import { createMachine, assign } from "xstate";

// --- internal

// --- utils
import { find, forEach, isEmpty, last, every } from "lodash-es";

// - --types
import type { ClientListingsContext, ClientListingsEvents } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./listings.machine.typegen").Typegen0,
    id: "clientListingsManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      raw: [], // spawned actors
      items: [], // filtered actors
      filters: undefined,
      selected: undefined,
      // ---
      error: undefined,
    },
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        invoke: {
          id: "authCallback",
          src: "authSubscription",
        },
        on: {
          SESSION: { target: "checking" },
        },
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: { target: "available" },
          onError: { target: "unavailable" },
        },
      },

      unavailable: {
        on: {
          AUTHENTICATED: { target: "available" },
        },
      },

      available: {
        initial: "loading",
        states: {
          loading: {
            id: "loading",
            entry: ["clearError", "clearItems"],
            invoke: {
              src: "load",
              onDone: [
                {
                  target: "processing",
                  actions: ["setItems", "resetFiltered", "setInitial"],
                  cond: (_context, { data }) => data,
                },
                {
                  target: "idle",
                  actions: ["setItems", "resetFiltered"],
                },
              ],
              onError: {
                target: "#error",
                actions: ["setError", "clearSelected"],
              },
            },
          },
          idle: {
            always: [{ target: "empty", cond: "hasNoItems" }],
          },

          processing: {
            always: [{ target: "idle", cond: "isNotProcessing" }],
          },
          empty: {
            always: [{ target: "idle", cond: "hasItems" }],
          },

          filtering: {
            invoke: {
              src: "filter",
              onDone: {
                target: "filtered",
                actions: ["setFiltered"],
              },
              onError: {
                target: "filtered",
                actions: ["resetFiltered"],
              },
            },
          },
          filtered: {
            initial: "empty",
            states: {
              empty: {
                always: [
                  {
                    target: "available",
                    cond: "hasFilteredItems",
                  },
                ],
              },
              available: {
                always: [
                  {
                    target: "empty",
                    cond: "hasNoFilteredItems",
                  },
                ],
              },
            },
          },
          editing: {},
        },
        on: {
          REFRESH: {
            target: "available",
            actions: ["setInitial"],
          },

          SELECT: {
            actions: ["setSelected"],
          },

          FILTER: [{ target: "available.filtering", actions: ["setFilters"] }],

          ADD: {
            target: "available.editing",
            actions: ["add", "setSelectedNew"],
          },

          EDIT: {
            target: "available.editing",
            actions: ["setSelected"],
          },
        },
      },

      error: { id: "error" },
      complete: {
        type: "final",
      },
    },
    on: {
      STOP: {
        target: "complete",
      },

      UNAUTHENTICATED: {
        target: "unavailable",
        actions: ["clearError", "clearItems"],
      },
    },
  },
  {
    actions: {
      add: assign({
        //  should be provided withConfig
      }),

      setItems: assign({
        //  should be provided withConfig
      }),

      resetFiltered: assign({
        items: ({ raw }, _event) => raw,
        filters: undefined,
      }),

      setFiltered: assign({
        items: (_context, { data }) => data,
      }),

      setFilters: assign({
        filters: (_context, { data }) => data,
      }),
      // --------------------------------------------

      clearItems: assign({
        raw: ({ raw }, _event) => {
          forEach(
            raw,
            item => !item?.state?.done && item?.stop && item?.stop()
          );
          return [];
        },
        items: [],
        selected: undefined,
        filters: undefined,
      }),

      setInitial: assign({
        initial: (
          _context: ClientListingsContext,
          { data }: ClientListingsEvents
        ) => data,
        selected: (
          { raw, initial }: ClientListingsContext,
          _event: ClientListingsEvents
        ) => find(raw, ["id", initial]), //|| find(raw, "state.context.model.default")
      }),

      setSelected: assign({
        initial: undefined,
        // filters: undefined,
        // items: ({ raw }, _event) => raw,
        selected: (
          { raw }: ClientListingsContext,
          { data }: ClientListingsEvents
        ) => find(raw, ["id", data]), // || find(raw, "state.context.model.default")
      }),

      setSelectedNew: assign({
        initial: undefined,
        filters: undefined,
        items: ({ raw }, _event) => raw,
        selected: (
          { raw }: ClientListingsContext,
          _event: ClientListingsEvents
        ) => last(raw),
      }),

      clearSelected: assign({
        initial: undefined,
        filters: undefined,
        items: ({ raw }, _event) => raw,
        selected: undefined,
      }),

      // ---
      setError: assign({
        error: (_context, { data }) => {
          const error = data?.error;
          return error || data;
        },
      }),

      clearError: assign({ error: null }),
    },
    guards: {
      isNotProcessing: ({ raw }) => {
        return every(raw, item => !item?.state?.matches("loading"));
      },
      hasItems: ({ raw }) => !isEmpty(raw),
      hasNoItems: ({ raw }) => isEmpty(raw),
      hasFilteredItems: ({ items }) => !isEmpty(items),
      hasNoFilteredItems: ({ items }) => isEmpty(items),
    },
  }
);
