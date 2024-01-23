// --- external
import { createMachine, assign, spawn } from "xstate";

// --- internal
import placeMachine from "./place.machine";
import type { PlacesContext, PlacesEvents } from "./types";

// --- utils
import { find, isEmpty, first, forEach, uniqueId, get } from "lodash-es";

// ---types
import type { IAddress } from "./types";

// --------------------------------------------------------
// utility function to spawn machines based on the given items
function spawnConfiguration(model = {} as IAddress) {
  const name = get(model, "id", uniqueId("place_"));

  try {
    return spawn(placeMachine.withContext({ model }), {
      name,
      sync: true
    });
  } catch (err) {
    console.error("Places", "spawnConfiguration", { name, model });
  }
}

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./places.machine.typegen").Typegen0,
    id: "placesManager",
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
          onDone: {
            target: "empty",
            actions: ["setItems", "setSelected"]
          },
          onError: {
            target: "error",
            actions: ["setError", "clearSelected"]
          }
        }
      },
      // our initial state depends on if the machine has any place
      // If we have context > place, we can skip to available
      // otherwise we will await a place
      // individual place events are defined to allow for more granular control
      empty: {
        always: [{ target: "available", cond: "hasItems" }]
      },
      available: {
        always: [{ target: "empty", cond: "hasNoItems" }]
      },
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
        target: "selected",
        actions: ["setSelected"],
        cond: "isSelectable"
      },

      ADD: {
        target: "available",
        actions: ["add"]
      },

      STOP: {
        target: "complete"
      }
    }
  },
  {
    actions: {
      add: assign({
        items: ({ items }: PlacesContext, { data }: PlacesEvents) => {
          // spawn an actor for the new items
          const machine = spawnConfiguration(data);
          items.push(machine);

          return items;
        }
      }),

      setItems: assign({
        items: ({ items }: PlacesContext, { data }: PlacesEvents) => {
          const items = [];

          forEach(data, place => {
            const item = find(items, ["id", place.id]);
            if (!item) {
              const machine = spawnConfiguration(place);
              items.push(machine);
            } else {
              items.push(item);
            }
          });

          return items;
        },
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
          { items, selected }: PlacesContext,
          { data }: PlacesEvents
        ) => {
          return find(items, ["id", data.id]) || selected || first(items);
        }
      }),

      clearSelected: assign({
        selected: undefined
      })
    },

    guards: {
      isSelectable: ({ items }, { data }) => find(items, ["id", data.id]),
      hasItems: ({ items }) => !isEmpty(items),
      hasNoItems: ({ items }) => isEmpty(items)
    }
  }
);
