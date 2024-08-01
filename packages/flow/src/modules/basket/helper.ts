// --- external

// --- internal
import { useBasket } from "./";

// --- utils
import { forEach, get } from "lodash-es";

// --------------------------------------------------------

async function add(context, basket, target = "items") {
  const items = get(context, target, []);

  const promises = [];

  forEach(items, item => {
    debugger;
    const product = context.basketItemBuilder(item);
    debugger;

    const mapping = context.basketItemMapper(item);
    debugger;

    const basketItem = basket.findItem(mapping);
    debugger;
    if (product && !basketItem) {
      debugger;
      promises.push(basket.addItem(product));
    }
  });

  return Promise.all(promises);
}

async function remove(context, basket, target = "items") {
  const items = get(context, target, []);
  const promises = [];

  debugger;
  forEach(basket.getItemsSnapshot(), basketItem => {
    debugger;
    const model = get(basketItem.getSnapshot(), "context.model");
    const mapping = context.itemMapper(model);
    debugger;
    if (!basket.exists(items, mapping)) {
      debugger;
      // send the command and set the item to be processed
      promises.push(basket.removeItem(basketItem.id));
    }
  });

  return Promise.all(promises);
}

async function update(context, basket, target = "items") {
  debugger;
  return basket.update(() => {
    // // finally cleanup and refresh any items that have been updated
    // // once the basket has been processed
    // const basketItems = basket.getItemsSnapshot();
    // // find any items that are in the basket but not in the actor
    // const missingItems = [];
    // forEach(basketItems, basketItem => {
    //   const model = get(basketItem, "state.context.model");
    //   const product = get(basketItem, "state.context.lookups.product");
    //   const mapping = context.basketItemMapper(model);
    //   // check all our mapping values are set, if not then its not a valid mapping and we can skip it
    //   const isValid = isEmpty(pickBy(mapping, isEmpty));
    //   if (isValid && !basket.exists(items, mapping)) {
    //     const data = context.itemBuilder({
    //       ...model,
    //       ...product,
    //     });
    //     missingItems.push(data);
    //   }
    // });
    // return missingItems;
  });
}

async function sync(context, basket, target = "items") {
  debugger;
  add(context, basket, target)
    .then(() => remove(context, basket, target))
    .finally(() => update(context, basket, target));

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
  return basket.update(() => {
    // // finally cleanup and refresh any items that have been updated
    // // once the basket has been processed
    // const basketItems = basket.getItemsSnapshot();
    // // find any items that are in the basket but not in the actor
    // const missingItems = [];
    // forEach(basketItems, basketItem => {
    //   const model = get(basketItem, "state.context.model");
    //   const product = get(basketItem, "state.context.lookups.product");
    //   const mapping = context.basketItemMapper(model);
    //   // check all our mapping values are set, if not then its not a valid mapping and we can skip it
    //   const isValid = isEmpty(pickBy(mapping, isEmpty));
    //   if (isValid && !basket.exists(items, mapping)) {
    //     const data = context.itemBuilder({
    //       ...model,
    //       ...product,
    //     });
    //     missingItems.push(data);
    //   }
    // });
    // return missingItems;
  });

  //   // wait for our basket to be ready, then sync basket items with the actor...
  //   waitFor(service, state =>
  //     ["shopping.refreshing.complete"].some(state.matches)
  //   ).then(() => {
  //
  //   });

  //   if (state.matches("shopping.items.processed")) {
  //     forEach(processingItems, (basketItem, id) => {
  //       actor.send({ type: "REFRESH" });
  //       unset(processingItems, id);
  //     });
  //   }
  // });
}

// --------------------------------------------------------

export function syncSubscription(callback, onReceive) {
  const basket = useBasket();
  onReceive(event => {
    switch (event.type) {
      case "ADD":
        add(event.data, basket, event.target)
          .then(data => callback({ type: "ADDED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;
      case "REMOVE":
        remove(event.data, basket, event.target)
          .then(data => callback({ type: "REMOVED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;
      case "UPDATE":
        update(event.data, basket, event.target)
          .then(data => callback({ type: "REMOVED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;
      case "SYNC":
        sync(event.data, basket, event.target)
          .then(data => callback({ type: "SYNCED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;
    }
  });

  return () => {
    //  no need t odo anything here, as we are not doing any cleanup
  };
}

// --------------------------------------------------------
