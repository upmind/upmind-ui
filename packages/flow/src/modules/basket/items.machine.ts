// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { sendTo, sendParent } = actions;

// --- internal
import services from "./services";
import itemMachine from "./item.machine";

// --- utils
import {
  every,
  find,
  includes,
  isEmpty,
  map,
  remove,
  some,
  trimStart,
  uniqueId
} from "lodash-es";

// --------------------------------------------------------
// utility function to spawn machines based on the given items
function spawnItem(basketId, productId) {
  return spawn(itemMachine({ basketId, productId }), {
    name: uniqueId(`${productId}_`),
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
            actions: ["setBasket", "sendBasket", "load"]
          },
          onError: { target: "#error" }
        }
      },

      // our initial state depends on if the machine has any items, and what state they are in
      // If we have donts have items, we go to empty
      // otherwise we will check if any items are still configuring
      // if so we will go to configuring
      // otherwise we will go to complete, which indicates there is no further work to do
      // unless we receive an ADD event, which will send us back to configuring
      empty: {
        always: [{ target: "configuring", cond: "hasItems" }]
      },

      // Products that need configuring BEFORE they are added to the basket
      // MAYBE: Once added we can receive a message to update the product, if we wan tto keep he item after saving to allow updates?
      configuring: {
        always: [{ target: "complete", cond: "allConfigured" }],
        on: {
          // REFRESH: { actions: "sendBasket" },
          // This transition will match any event, but we will target the completion of ANY spawned machine
          "*": {
            actions: ["sendBasket", "remove"],
            cond: (context, event) => includes(event.type, "done.invoke")
          }
        }
      },

      // // Products that need provisioning AFTER they are added to the basket
      // provisioning: {
      //   always: [{ target: "complete", cond: "allConfigured" }]
      // },

      complete: {
        type: "final"
      },

      // Handle errors
      error: {
        id: "error"
      }
    },
    on: {
      ADD: {
        target: "configuring",
        actions: ["add"]
      },
      REMOVE: {
        actions: ["remove"]
      }
      // UPDATE: {
      //   actions: ["update"]
      // }
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
        items: ({ items }, event, other) => {
          console.log("remove", { event, other });
          const name =
            event?.data?.name || trimStart(event.type, "invoke.done.");
          // try find any items with the same hash
          const item = find(items, ["id", name]);
          // if it exists, stop the referenced machine
          // and remove it from our list of items
          if (item) item.stop();
          remove(items, ["id", name]);
          return items;
        }
      }),

      // update: (_context, { data: { name, item } }) => {
      //   debugger;
      //   sendTo(name, { type: "UPDATE", data: item });
      // },

      // ---

      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),
      clearError: assign({ error: null })
    },

    guards: {
      hasNoBasket: ({ basketId }) => !basketId,

      hasItems: ({ items }) => {
        return !isEmpty(items);
      },
      hasNoItems: ({ items }) => {
        return isEmpty(items);
      },
      allConfigured: ({ items }) => {
        // debugger;
        return (
          !items.length ||
          every(items, (item, id) => item?.state?.matches("idle"))
        );
      },
      someConfiguring: ({ items }) => {
        return some(items, item => item?.state?.matches("configuring"));
      }
    },
    services
  }
);
