// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import basketMachine from "./basket.machine";

// --- utils
import { forEach, get, set, unset, every, find, some, remove } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(basketMachine, { devTools: true }).onTransition(
  newState => (state = newState)
);

const itemExists = (items = [], conditions) => {
  return some(items, basketItem =>
    every(
      conditions,
      (value, key) => get(basketItem, `state.context.values.${key}`) == value
    )
  );
};
// --------------------------------------------------------

export const useBasket = () => {
  // --------------------------------------------------------
  // methods

  const findItem = conditions =>
    find(state?.context?.items, basketItem =>
      every(
        conditions,
        (value, key) => get(basketItem, `state.context.values.${key}`) == value
      )
    );

  // --------------------------------------------------------

  return {
    service: service.start(),
    // ---
    getSnapshot: () => state,
    getItemsSnapshot: () => state?.context?.items || [],
    findItem,
    itemExists: conditions => itemExists(conditions, state?.context?.items)
  };
};

export const useBasketHelper = (
  actor,
  states,
  context,
  conditionsBuilder,
  basketItemBuilder,
  itemBuilder
) => {
  // TODO: check if there is a valid actor and that it is started
  const { findItem, itemExists, service, getItemsSnapshot } = useBasket();
  const newItems = [];
  const processingItems = {};

  // wait for our basket to be ready, then sync any matching items to the actor...
  waitFor(service, state => ["shopping"].some(state.matches)).then(() => {
    const items = get(actor, `state.context.${context}`, []);
    const basketItems = getItemsSnapshot();

    // find any items that are in the basket but not in the actor
    const missing = [];
    forEach(basketItems, basketItem => {
      const conditions = conditionsBuilder(basketItem);

      if (!itemExists(items, conditions)) {
        const data = itemBuilder({
          ...basketItem.state.context.values,
          ...basketItem.state.context.available.product
        });
        missing.push(data);
      }
    });
    // and sync them to the actor
    actor.send({ type: "SYNC", data: missing });
  });

  // watch the provided actor for state changes so we can sync items
  actor.onTransition(newState => {
    // bail if the state is not one of the states we are interested in
    if (!states.some(newState.matches)) return;

    const items = get(newState.context, context, []);

    forEach(items, item => {
      const data = basketItemBuilder(item);
      const conditions = conditionsBuilder(item);
      console.log("basket helper item", { data, conditions });

      const basketItem = findItem(conditions);

      if (!basketItem) {
        // let the actor know we are syncing so we dont do anyhting else
        actor.send({ type: "SYNC" });
        // add the item to the basket and get the corresponding machine
        service.send({ type: "ADD", data });
        newItems.push(conditions);
      } else {
        // TODO: upate the item id the values have changed
        set(processingItems, basketItem.id, basketItem);
        // let the actor know we are syncing so we dont do anyhting else
        // actor.send({ type: "SYNC" });
      }
    });
  });

  // watch the basket so we can update the newItems items
  service.onTransition(newState => {
    if (!newItems.length) return;

    forEach(newItems, conditions => {
      const basketItem = findItem(conditions);
      if (basketItem) {
        set(processingItems, basketItem.id, basketItem);
        remove(newItems, conditions);
      }
    });

    forEach(processingItems, basketItem => {
      // now wait for basket item to be ready, before we send the update message to the basket
      waitFor(basketItem, state => ["configured"].some(state.matches)).then(
        () => {
          service.send({
            type: "UPDATE",
            data: { itemId: basketItem.id }
          });

          waitFor(service, state =>
            state.matches("shopping.items.configured")
          ).then(() => {
            actor.send({ type: "REFRESH" });
          });
          unset(processingItems, basketItem);
        }
      );
    });
  });
};
