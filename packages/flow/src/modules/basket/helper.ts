// --- external

// --- internal
import { useBasket } from ".";
import productServices from "./products/services";

// --- utils
import { forEach, get, reduce, isEmpty, pickBy, isArray, map } from "lodash-es";

// --------------------------------------------------------
async function fetch(context, basket) {
  const basketItems = basket.getItemsSnapshot();

  return basket.isReady().then(() => {
    return reduce(
      basketItems,
      (result, basketItem) => {
        const model = get(basketItem, "state.context.model");
        const product = get(basketItem, "state.context.lookups.product");
        const mapping = context.basketItemMapper(model);
        // check all our mapping values are set, if not then its not a valid mapping and we can skip it
        const isValid = isEmpty(pickBy(mapping, isEmpty));
        if (isValid) {
          const data = context.itemBuilder({
            ...model,
            ...product,
          });
          result.push(data);
        }

        return result;
      },
      []
    );
  });
}

async function add(item, context, basket) {
  if (isEmpty(item)) return Promise.resolve();

  const mapping = context.basketItemMapper(item);
  const basketItem = basket.findItem(mapping);
  if (basketItem) return Promise.resolve(); // its allready added, so we can skip it

  const product = context.basketItemBuilder(item);
  if (!product) return Promise.reject("No product found");

  return basket.addItem(product);
}

async function remove(item, context, basket) {
  const mapping = context.basketItemMapper(item);
  const basketItem = basket.findItem(mapping);

  if (!basketItem) return Promise.resolve();

  return productServices
    .remove({ basket }, { data: basketItem })
    .then(() => basket.refresh());
}

async function update(item, context, basket) {
  debugger;
  if (isEmpty(item)) return Promise.resolve();
  debugger;
  const mapping = context.basketItemMapper(item);
  const basketItem = basket.findItem(mapping);
  const basket_id = basket.getBasketId();
  debugger;
  if (!basketItem) return Promise.reject("No item found");
  debugger;
  return productServices
    .update({ basket_id }, { data: basketItem })
    .then(() => basket.refresh());
}

async function sync(items, context, basket) {
  const basketItems = basket.getItemsSnapshot();

  if (isEmpty(items) && isEmpty(basketItems)) return Promise.resolve();

  // safey check to ensure we have an array of items
  items = isArray(items) ? items : [items];

  // First ensure all our items are added to the basket...
  // Then update all our items individually
  const promises = map(items, item =>
    add(item, context, basket).then(() => update(item, context, basket))
  );

  return Promise.all(promises);

  // remove all dangling items
  // .then(() => {
  // forEach(basketItems, basketItem => {
  //   const model = get(basketItem.getSnapshot(), "context.model");
  //   const mapping = context.itemMapper(model);
  //   if (!basket.itemExists(items, mapping)) {
  //     // send the command and set the item to be processed
  //     promises.push(basket.removeItem(basketItem.id));
  //   }
  // });
  // });

  // .finally(() => {
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
  // });

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
}

// --------------------------------------------------------

export function syncSubscription(callback, onReceive) {
  const basket = useBasket();
  onReceive(event => {
    switch (event.type) {
      case "FETCH":
        fetch(event.context, basket)
          .then(data => callback({ type: "SYNCED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;

      case "ADD":
        add(event.target, event.context, basket)
          .then(data => callback({ type: "SYNCED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;
      case "REMOVE":
        remove(event.target, event.context, basket)
          .then(data => callback({ type: "SYNCED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;
      case "UPDATE":
        update(event.target, event.context, basket)
          .then(data => callback({ type: "SYNCED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;
      case "SYNC":
        sync(event.target, event.context, basket)
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
