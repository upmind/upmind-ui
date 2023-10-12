// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services.products";
import itemMachine from "./item.machine";

// --- utils
import { isEmpty, set, get, unset, some, every, map } from "lodash-es";

// --------------------------------------------------------
// utility function to spawn machines based on the given items
function spawnItem(basketId, item) {
  const name = item.id;
  return spawn(itemMachine({ name, basketId, item }), {
    name,
    sync: true
  });
}

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./items.machine.typegen").Typegen0,
    id: "itemsManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      basketId: null,
      items: []
    },
    states: {
      loading: {
        entry: ["spawnItems"],
        always: { target: "empty" }
      },

      // our initial state depends on if the machine has any items, and what state they are in
      // If we have donts have items, we go to empty
      // otherwise we will check if any items are still configuring
      // if so we will go to configuring
      // otherwise we will go to configured, which indicates there is no further work to do
      // unless we receive an ADD event, which will send us back to configuring
      empty: {
        always: [{ target: "configuring", cond: "hasItems" }]
      },
      configuring: {
        always: [
          { target: "empty", cond: "hasNoItems" },
          { target: "configured", cond: "allConfigured" }
        ]
      },
      configured: {
        always: [
          { target: "empty", cond: "hasNoItems" },
          { target: "configuring", cond: "someConfiguring" }
        ]
        // type: "final"
      },

      // Handle errors
      error: {
        id: "error"
      }
    },
    on: {
      REMOVE: {
        actions: ["remove"]
      },
      UPDATE: {
        actions: ["update"]
      }
    }
  },
  {
    actions: {
      spawnItems: assign({
        items: ({ basketId, items }) => {
          const machines = map(items, item => spawnItem(basketId, item));
          return machines;
        }
      }),
      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),
      clearError: assign({ error: null }),
      // ---
      remove: assign({
        items: ({ items }, { data: { name } }) => {
          // try find any items with the same hash
          const item = get(items, name);

          // if it exists, stop the referenced machine
          // and remove it from our list of items
          if (item) item.stop();

          unset(items, name);

          return items;
        }
      }),

      // update
      update: (_context, { data: { name, item } }) => {
        debugger;
        sendTo(name, { type: "UPDATE", data: item });
      }
    },

    guards: {
      hasItems: ({ items }) => {
        return !isEmpty(items);
      },
      hasNoItems: ({ items }) => {
        return isEmpty(items);
      },
      allConfigured: ({ items }) => {
        return every(items, item => item.state.matches("idle"));
      },
      someConfiguring: ({ items }) => {
        return some(items, item => item.state.matches("configuring"));
      }
    },
    services
  }
);
