// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import basketMachine from "./basket.machine";

// --- utils
import {
  forEach,
  get,
  set,
  unset,
  every,
  find,
  some,
  remove,
  includes
} from "lodash-es";

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(basketMachine, { devTools: true }).onTransition(
  newState => (state = newState)
);

const exists = (items = [], mapping, context = null) => {
  context = context ? `${context}.` : "";
  return some(items, item =>
    every(mapping, (value, key) => {
      const itemValue = get(item, `${context}${key}`, get(item, key));
      const matches = itemValue == value;
      // console.log("exists", {
      //   item,
      //   key: `${context}${key}`,
      //   itemValue,
      //   value,
      //   matches
      // });
      return matches;
    })
  );
};
// --------------------------------------------------------

export const useBasket = () => {
  // --------------------------------------------------------
  // methods

  const findItem = mapping =>
    find(state?.context?.items, basketItem =>
      every(
        mapping,
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
    itemExists: mapping =>
      exists(state?.context?.items, mapping, "state.context.values")
  };
};

export const useBasketHelper = (
  actor,
  states,
  context,
  basketItemMapper,
  basketItemBuilder,
  itemMapper,
  itemBuilder
) => {
  // TODO: check if there is a valid actor and that it is started
  const { findItem, itemExists, service, getItemsSnapshot } = useBasket();
  const newItems = [];
  const processingItems = {};

  // wait for our basket to be ready, then sync basket items with the actor...
  waitFor(service, state => ["shopping"].some(state.matches)).then(() => {
    const items = get(actor, `state.context.${context}`, []);
    const basketItems = getItemsSnapshot();

    // find any items that are in the basket but not in the actor
    const missing = [];
    forEach(basketItems, basketItem => {
      const mapping = basketItemMapper(basketItem.state.context.values);

      if (!exists(items, mapping)) {
        const data = itemBuilder({
          ...basketItem.state.context.values,
          ...basketItem.state.context.available.product
        });
        missing.push(data);
      }
    });

    actor.send({ type: "SYNC", data: missing });
  });

  // watch the provided actor for state changes so we can sync items
  actor.onTransition(newState => {
    // bail if the state is not one of the states we are interested in
    if (!states.some(newState.matches)) return;

    const items = get(newState, `context.${context}`, []);
    const basketItems = getItemsSnapshot();

    // first, handle items not in the domain machine, ie dangling items
    forEach(basketItems, basketItem => {
      if (!basketItem) return;

      const mapping = itemMapper(basketItem?.state?.context?.values);

      if (!exists(items, mapping)) {
        // add the basket item to the list of dangling items, if it is not already there
        // this will then be processed when the basket is ready
        if (!get(processingItems, basketItem.id)) {
          // let the actor know we are syncing so we dont do anyhting else
          actor.send({ type: "SYNC" });

          // send the command and set the item to be processed
          service.send({ type: "REMOVE", data: { itemId: basketItem.id } });
          set(processingItems, basketItem.id, basketItem);
        }
      }
    });

    // handle items not in/out of date with the basket, ie new/updated items
    forEach(items, item => {
      const data = basketItemBuilder(item);
      const mapping = basketItemMapper(item);

      const basketItem = findItem(mapping);

      if (!basketItem) {
        // let the actor know we are syncing so we dont do anyhting else
        actor.send({ type: "SYNC" });
        // add the item to the basket and get the corresponding machine
        service.send({ type: "ADD", data });
        newItems.push(mapping);
      } else {
        // TODO: upate the item id the values have changed
        // set(processingItems, basketItem.id, basketItem);
        // let the actor know we are syncing so we dont do anyhting else
        // actor.send({ type: "SYNC" });
      }
    });
  });

  // Finally watch the basket so we can update the newItems items
  service.onTransition(newState => {
    // trigger new items to be process once they are ready/configured
    forEach(newItems, mapping => {
      const basketItem = findItem(mapping);
      if (basketItem?.state?.matches("configured")) {
        service.send({
          type: "UPDATE",
          data: { itemId: basketItem.id }
        });
        set(processingItems, basketItem.id, basketItem);
        remove(newItems, mapping);
      }
    });

    // finally cleanup and refresh any items that have been updated
    // once the basket has been processed
    if (newState.matches("shopping.items.processed")) {
      forEach(processingItems, (basketItem, id) => {
        actor.send({ type: "REFRESH" });
        unset(processingItems, id);
      });
    }
  });
};
