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
  last,
  matches,
  pickBy,
  remove,
  set,
  some,
  unset,
} from "lodash-es";

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(basketMachine, { devTools: false });

// --------------------------------------------------------
// methods
// --------------------------------------------------------
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

export const useBasket = () => {
  return {
    service: service.start(),
    // ---
    isReady: async () =>
      waitFor(service, state => ["shopping", "checkout"].some(state.matches), {
        timeout: Infinity, // infinity = no timeout
      }),
    getSnapshot: () => service.getSnapshot(),
    getItemsSnapshot: () => service.getSnapshot()?.context?.items || [],
    findItem: mapping =>
      find(service.getSnapshot()?.context?.items, basketItem =>
        every(mapping, (value, key) => {
          if (key == "id") {
            return basketItem.id == value;
          } else {
            return get(basketItem, `state.context.model.${key}`) == value;
          }
        })
      ),
    itemExists: mapping =>
      exists(
        service.getSnapshot()?.context?.items,
        mapping,
        "state.context.model"
      ),
    addItem: async ({
      id,
      product_id,
      quantity,
      term,
      attributes,
      options,
    }) => {
      // lets wait for our basket  to be ready for shopping
      return waitFor(service, state => state.matches("shopping")).then(() => {
        // lets add the new product base don the provided config to the basket
        service.send({
          type: "ADD",
          data: { id, product_id, quantity, term, attributes, options },
        });

        // then wait/check for the new product actor to be configured
        // then send the update event to the basket
        return last(service.getSnapshot().context?.items);
      });
    },
    updateItem: async itemId => {
      service.send({ type: "UPDATE", data: { itemId } });
      return waitFor(service, state =>
        ["shopping.items.processed", "shopping.items.processing.error"].some(
          state.matches
        )
      ).then(state => {
        if (state.matches("shopping.items.processing.error")) {
          return Promise.reject();
        }
        return Promise.resolve();
      });
    },
    removeItem: itemId => {
      service.send({ type: "REMOVE", data: { itemId } });
    },
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

  // watch the provided actor for state changes so we can add or remove items
  actor.onTransition(state => {
    // bail if the state is not one of the states we are interested in
    if (!states.some(state.matches)) return;

    const items = get(state, `context.${context}`, []);
    const basketItems = getItemsSnapshot();

    // handle items not in the basket, ie new items
    forEach(items, item => {
      const product = basketItemBuilder(item);
      const mapping = basketItemMapper(item);
      const basketItem = findItem(mapping);

      if (product && !basketItem && !includes(dirtyItems, mapping)) {
        // add the item to the basket
        service.send({ type: "ADD", data: product });
        dirtyItems.push(mapping);
      }
    });

    //  handle items not in the actor, ie dangling items
    forEach(basketItems, basketItem => {
      if (!basketItem) return;

      const mapping = itemMapper(basketItem?.state?.context?.model);
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

    // sync the parent item's config with the actor
    if (parentMapper && parentBuilder) {
      const product = parentBuilder(items);
      const mapping = parentMapper();
      const basketItem = findItem(mapping);
      if (basketItem) {
        const model = get(basketItem, "state.context.model");
        const isDirty = !isEmpty(product) && !some([model], matches(product));
        if (isDirty && !includes(dirtyItems, mapping)) {
          // update the basket item  with the new parent model
          basketItem.send({ type: "PUT", data: product });
          dirtyItems.push(mapping);
        }
      }
    }
  });

  // watch the basket so we can process items and sync with the actor
  service.onTransition(state => {
    // trigger new items to be process once they are ready/configured
    forEach(dirtyItems, mapping => {
      const basketItem = findItem(mapping);
      if (basketItem?.state?.matches("configured")) {
        service.send({
          type: "UPDATE",
          data: { itemId: basketItem.id },
        });
        set(processingItems, basketItem.id, basketItem);
        remove(dirtyItems, mapping);
      }
    });

    // finally cleanup and refresh any items that have been updated
    // once the basket has been processed

    // wait for our basket to be ready, then sync basket items with the actor...
    waitFor(service, state =>
      ["shopping.refreshing.complete"].some(state.matches)
    ).then(() => {
      const items = get(actor, `state.context.${context}`, []);
      const basketItems = getItemsSnapshot();

      // find any items that are in the basket but not in the actor
      const missingItems = [];
      forEach(basketItems, basketItem => {
        const mapping = basketItemMapper(basketItem.state.context.model);
        // check all our mapping values are set, if not then its not a valid mapping and we can skip it
        const isValid = isEmpty(pickBy(mapping, isEmpty));

        if (isValid && !exists(items, mapping)) {
          const data = itemBuilder({
            ...basketItem.state.context.model,
            ...basketItem.state.context.lookups.product,
          });
          missingItems.push(data);
        }
      });

      actor.send({ type: "SYNC", data: missingItems });
    });

    if (state.matches("shopping.items.processed")) {
      forEach(processingItems, (basketItem, id) => {
        actor.send({ type: "REFRESH" });
        unset(processingItems, id);
      });
    }
  });
};
