// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "./";

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
async function sync(context, basket) {
  // watch the provided actor for state changes so we can add or remove items

  // only proceed if the actor is in one of the provided states
  const items = get(context, "items", []); // could this be a function or dynamic prop name?
  const basketItems = basket.getItemsSnapshot();

  // !) add new items, ie items NOT in the basket
  forEach(items, item => {
    const product = context.basketItemBuilder(item);
    const mapping = context.basketItemMapper(item);
    const basketItem = basket.findItem(mapping);

    if (product && !basketItem) {
      debugger;
      basket.addItem(product);
    }
  });

  // 2) remove dangling items, ie items NOT in the context but in the basket
  forEach(basketItems, basketItem => {
    debugger;
    const model = get(basketItem, "state.context.model");
    const mapping = context.itemMapper(model);
    debugger;
    if (!basket.exists(items, mapping)) {
      debugger;
      // send the command and set the item to be processed
      basket.removeItem(basketItem.id);
    }
  });

  // 3) sync the parent item's config with the context
  // if (parentMapper && parentBuilder) {
  //   const product = parentBuilder(items);
  //   const mapping = parentMapper();
  //   const basketItem = findItem(mapping);
  //   if (basketItem) {
  //     const model = get(basketItem, "state.context.model");
  //     const isDirty = !isEmpty(product) && !some([model], matches(product));
  //     if (isDirty && !includes(dirtyItems, mapping)) {
  //       // update the basket item  with the new parent model
  //       basketItem.send({ type: "PUT", data: product });
  //       dirtyItems.push(mapping);
  //     }
  //   }
  // }

  // 4) Update and wait for the basket to be processed
  basket.update();

  //   // finally cleanup and refresh any items that have been updated
  //   // once the basket has been processed

  //   // wait for our basket to be ready, then sync basket items with the actor...
  //   waitFor(service, state =>
  //     ["shopping.refreshing.complete"].some(state.matches)
  //   ).then(() => {
  //     const items = get(actor, `state.context.${context}`, []);
  //     const basketItems = getItemsSnapshot();

  //     // find any items that are in the basket but not in the actor
  //     const missingItems = [];
  //     forEach(basketItems, basketItem => {
  //       const mapping = basketItemMapper(basketItem.state.context.model);
  //       // check all our mapping values are set, if not then its not a valid mapping and we can skip it
  //       const isValid = isEmpty(pickBy(mapping, isEmpty));

  //       if (isValid && !exists(items, mapping)) {
  //         const data = itemBuilder({
  //           ...basketItem.state.context.model,
  //           ...basketItem.state.context.lookups.product,
  //         });
  //         missingItems.push(data);
  //       }
  //     });

  //     actor.send({ type: "SYNC", data: missingItems });
  //   });

  //   if (state.matches("shopping.items.processed")) {
  //     forEach(processingItems, (basketItem, id) => {
  //       actor.send({ type: "REFRESH" });
  //       unset(processingItems, id);
  //     });
  //   }
  // });
}

export function syncSubscription(callback, onReceive) {
  const basket = useBasket();

  onReceive(event => {
    if (event.type === "SYNC") {
      sync(event.data, basket)
        .then(data => {
          // send the summary back to the machine
          callback({ type: "SYNCED", data });
        })
        .catch(error => {
          // still notify the machine, but with an no value, so we can move out of the state
          callback({ type: "SYNCED", error });
        });
    }
  });

  return () => {
    //  no need t odo anything here, as we are not doing any cleanup
  };
}

// --------------------------------------------------------

export default {
  syncSubscription,
};
