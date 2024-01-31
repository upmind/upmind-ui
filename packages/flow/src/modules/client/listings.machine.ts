// --- external
import { createMachine, assign } from "xstate";

// --- internal

// --- utils
import { find, forEach, isEmpty, last } from "lodash-es";

// ---types
import type { ClientListingsContext, ClientListingsEvents } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./listings.machine.typegen").Typegen0,
    id: "clientListingsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      items: [], // spawned actors
      selected: undefined,
      // ---
      error: undefined
    },
    states: {
      loading: {
        entry: ["clearError", "clearItems"],
        invoke: {
          src: "load",
          onDone: [
            {
              target: "empty",
              actions: ["setItems"],
              cond: (_context, { data }) => data
            },
            {
              target: "available",
              actions: ["setItems"]
            }
          ],
          onError: {
            target: "error",
            actions: ["setError", "clearSelected"]
          }
        }
      },
      empty: {
        always: [{ target: "available", cond: "hasItems" }]
      },
      available: {
        always: [
          { target: "empty", cond: "hasNoItems" },
          { target: "selected", cond: "hasSelected" }
        ]
      },
      editing: {},
      selected: {},
      error: {},
      complete: {
        type: "final"
      }
    },
    on: {
      REFRESH: {
        target: ["loading"]
      },

      SELECT: {
        actions: ["setSelected"],
        cond: "isSelectable"
      },

      ADD: {
        target: "editing",
        actions: ["add", "setSelectedNew"]
      },

      EDIT: {
        target: "editing",
        actions: ["setSelected"]
      },

      STOP: {
        target: "complete"
      }
    }
  },
  {
    actions: {
      add: assign({
        //  should be provided withConfig
      }),

      setItems: assign({
        //  should be provided withConfig
      }),

      // --------------------------------------------

      clearItems: assign({
        items: ({ items }, _event) => {
          forEach(items, item => !item?.state?.done && item?.stop());
          return [];
        },
        selected: undefined
      }),

      setSelected: assign({
        selected: (
          { items }: ClientListingsContext,
          { data }: ClientListingsEvents
        ) =>
          find(items, ["id", data]) ||
          find(items, "state.context.model.default")
      }),

      setSelectedNew: assign({
        selected: (
          { items }: ClientListingsContext,
          _event: ClientListingsEvents
        ) => last(items)
      }),

      clearSelected: assign({
        selected: undefined
      }),

      // ---
      setError: assign({
        error: (context, { data }, meta) => {
          const error = data?.error;
          return error || data;
        }
      }),

      clearError: assign({ error: null })
    },
    guards: {
      isSelectable: ({ items }, { data }) => true, // todo checkthe model for any reason to not be selectable
      hasItems: ({ items }) => !isEmpty(items),
      hasNoItems: ({ items }) => isEmpty(items),
      hasSelected: ({ selected }) => !!selected?.id
    }
  }
);
