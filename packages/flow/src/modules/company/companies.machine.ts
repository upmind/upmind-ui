// --- external
import { createMachine, assign, spawn } from "xstate";

// --- internal
import companyMachine from "./company.machine";
import services from "./services";

// --- utils
import { find, forEach, get, isEmpty, last, map, uniqueId } from "lodash-es";

// ---types
import type { CompaniesContext, CompaniesEvents, IAddress } from "./types.d";

// --------------------------------------------------------
// utility function to spawn machines based on the given items
function spawnConfiguration(model = {} as IAddress) {
  const name = get(model, "id", uniqueId("company_"));

  try {
    return spawn(companyMachine.withContext({ model }), {
      name,
      sync: true
    });
  } catch (err) {
    console.error("Companies", "spawnConfiguration", { name, model });
  }
}

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./companies.machine.typegen").Typegen0,
    id: "companiesManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      items: [],
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
      // our initial state depends on if the machine has any company
      // If we have context > company, we can skip to available
      // otherwise we will await a company
      // individual company events are defined to allow for more granular control
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
        items: ({ items }: CompaniesContext, { data }: CompaniesEvents) => {
          // spawn an actor for the new items
          const machine = spawnConfiguration(data);
          items.push(machine);
          return items;
        }
      }),

      setItems: assign({
        items: ({ items }: CompaniesContext, { data }: CompaniesEvents) =>
          map(data, company => {
            const item = find(items, ["id", company.id]);
            if (!item) {
              const machine = spawnConfiguration(company);
              return machine;
            }

            return item;
          }),
        error: null
      }),

      clearItems: assign({
        items: ({ items }, _event) => {
          forEach(items, item => !item?.state?.done && item?.stop());
          return [];
        },
        selected: undefined
      }),

      setSelected: assign({
        selected: (
          { items, selected }: CompaniesContext,
          { data }: CompaniesEvents
        ) =>
          find(items, ["id", data]) ||
          find(items, "state.context.model.default")
      }),

      setSelectedNew: assign({
        selected: ({ items }: CompaniesContext, _event: CompaniesEvents) =>
          last(items)
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
    },
    services
  }
);
