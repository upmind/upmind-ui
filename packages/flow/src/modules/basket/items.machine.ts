// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { sendTo, sendParent } = actions;

// --- internal
import services from "./services";
import itemMachine from "./item.machine";

// --- utils
import { isEmpty, get, unset, some, every, map, uniqueId } from "lodash-es";

// --------------------------------------------------------
// utility function to spawn machines based on the given items
function spawnItem(basketId, product) {
  const name = product?.id || uniqueId("item_");
  return spawn(itemMachine({ name, basketId, product }), {
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
        always: [
          { target: "generating", cond: "hasNoBasket" },
          { target: "empty", actions: ["load"] }
        ]
      },

      // otherwise we will generate an "empty" basket
      generating: {
        id: "generating",
        invoke: {
          src: "create",
          onDone: {
            target: "empty",
            actions: ["load", "setBasket", "sendBasket"]
          },
          onError: { target: "#error" }
        }
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
      REFRESH: {
        actions: ["sendBasket"]
      },
      ADD: {
        actions: ["add"]
      },
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
      setBasket: assign({
        basketId: (_context, { data }) => data?.id
      }),

      sendBasket: sendParent((_context, { data }) => ({
        type: "REFRESH",
        data
      })),

      // ---
      load: assign({
        items: ({ basketId, items }) => {
          const machines = map(items, item => spawnItem(basketId, item));
          return machines;
        }
      }),

      add: assign({
        items: ({ basketId, items }, { data }) => {
          const machine = spawnItem(basketId, data);
          items.push(machine);
          return items;
        }
      }),

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

      update: (_context, { data: { name, item } }) => {
        debugger;
        sendTo(name, { type: "UPDATE", data: item });
      },

      // ---

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),
      clearError: assign({ error: null })
    },

    guards: {
      hasNoBasket: ({ basket }) => isEmpty(basket),

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
