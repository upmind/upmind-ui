// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import basketMachine from "./basket.machine";

// --- utils
import {
  every,
  find,
  forEach,
  get,
  includes,
  isEmpty,
  matches,
  pickBy,
  remove,
  set,
  some,
  unset
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
      every(mapping, (value, key) => {
        if (key == "id") {
          return basketItem.id == value;
        } else {
          return get(basketItem, `state.context.values.${key}`) == value;
        }
      })
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
  itemBuilder,
  parentMapper,
  parentBuilder
) => {
  // TODO: check if there is a valid actor and that it is started
  const { findItem, service, getItemsSnapshot } = useBasket();
  const dirtyItems = [];
  const processingItems = {};

  // wait for our basket to be ready, then sync basket items with the actor...
  waitFor(service, state => ["shopping"].some(state.matches)).then(() => {
    const items = get(actor, `state.context.${context}`, []);
    const basketItems = getItemsSnapshot();

    // find any items that are in the basket but not in the actor
    const missingItems = [];
    forEach(basketItems, basketItem => {
      const mapping = basketItemMapper(basketItem.state.context.values);
      // check all our mapping values are set, if not then its not a valid mapping and we can skip it
      const isValid = isEmpty(pickBy(mapping, isEmpty));

      if (isValid && !exists(items, mapping)) {
        const data = itemBuilder({
          ...basketItem.state.context.values,
          ...basketItem.state.context.available.product
        });
        missingItems.push(data);
      }
    });

    actor.send({ type: "SYNC", data: missingItems });
  });

  // watch the provided actor for state changes so we can sync items
  actor.onTransition(newState => {
    // bail if the state is not one of the states we are interested in
    if (!states.some(newState.matches)) return;

    const items = get(newState, `context.${context}`, []);
    const basketItems = getItemsSnapshot();

    //  handle items not in the actor, ie dangling items
    forEach(basketItems, basketItem => {
      if (!basketItem) return;

      const mapping = itemMapper(basketItem?.state?.context?.values);
      const isValid = isEmpty(pickBy(mapping, isEmpty));

      if (isValid && !exists(items, mapping)) {
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

    // handle items not in the basket, ie new items
    forEach(items, item => {
      const product = basketItemBuilder(item);
      const mapping = basketItemMapper(item);

      const basketItem = findItem(mapping);

      if (product && !basketItem && !includes(dirtyItems, mapping)) {
        // let the actor know we are syncing so we dont do anyhting else
        actor.send({ type: "SYNC" });
        // add the item to the basket
        service.send({ type: "ADD", data: product });
        dirtyItems.push(mapping);
      }

      // else {
      // let the actor know we are syncing so we dont do anyhting else
      // actor.send({ type: "SYNC" });
      // update the item to the basket
      // service.send({ type: "UPDATE", data: { product } });
      // dirtyItems.push(mapping);
      // }
    });

    // handle syncing the parent item's config with the actor
    if (parentMapper && parentBuilder) {
      const product = parentBuilder(items);
      const mapping = parentMapper();
      const basketItem = findItem(mapping);
      if (basketItem) {
        const values = get(basketItem, "state.context.values");
        const isDirty = !isEmpty(product) && !some([values], matches(product));
        if (isDirty && !includes(dirtyItems, mapping)) {
          // let the actor know we are syncing so we dont do anyhting else
          actor.send({ type: "SYNC" });
          // update the basket item  with the new parent values
          basketItem.send({ type: "PUT", data: product });
          dirtyItems.push(mapping);
        }
      }
    }
  });

  // Finally watch the basket so we can update the dirtyItems items
  service.onTransition(newState => {
    // trigger new items to be process once they are ready/configured
    forEach(dirtyItems, mapping => {
      const basketItem = findItem(mapping);
      if (basketItem?.state?.matches("configured")) {
        service.send({
          type: "UPDATE",
          data: { itemId: basketItem.id }
        });
        set(processingItems, basketItem.id, basketItem);
        remove(dirtyItems, mapping);
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
