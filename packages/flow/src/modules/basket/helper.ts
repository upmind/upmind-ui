// --- external

// --- internal
import type { ActorRef } from "xstate";
import { useBasket } from ".";
import productServices from "./products/services";

// --- utils
import { has, get, reduce, isEmpty, pickBy, isArray, map } from "lodash-es";

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

/**
 * Add a new item to the basket
 *
 * @param item
 * @param context
 * @param basket
 * @returns {ActorRef<any, any>} XState Actor representing the new item
 */
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
  const basket_id = basket.getBasketId();
  const id = get(basketItem, "state.context.basket_product.id");
  return productServices.remove({ basket_id, id });
}

async function update(item, context, basket) {
  if (isEmpty(item)) return Promise.resolve();
  const mapping = context.basketItemMapper(item);
  const basketItem = basket.findItem(mapping);
  const basket_id = basket.getBasketId();
  const id = get(basketItem, "state.context.basket_product.id");
  // ---
  if (!basketItem) return Promise.reject("No item found");

  const config = context.basketItemBuilder(item);
  if (!config) return Promise.reject("No product config provided");

  return productServices.update({ basket_id, id }, { data: config });
}

async function sync(items, context, basket) {
  const basketItems = basket.getItemsSnapshot();
  items = isArray(items) ? items : [items]; // safey check to ensure we have an array of items

  if (isEmpty(items) && isEmpty(basketItems)) return Promise.resolve();

  // First ensure all our items are added to the basket...
  // Then update all our items individually
  const promises = map(items, item =>
    add(item, context, basket).then(actor => {
      const itemContext = get(actor.getSnapshot(), "context");
      const model = get(itemContext, "model");
      return update(model, itemContext, basket);
    })
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
          .then(data => callback({ type: "FETCHED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;

      case "ADD":
        add(event.target, event.context, basket)
          .then(data => callback({ type: "ADDED", data }))
          .catch(error => callback({ type: "ERROR", error }));
        break;

      case "REMOVE":
        remove(event.target, event.context, basket)
          .then(data => {
            callback({ type: "REMOVED", data });
            basket.refresh();
          })
          .catch(error => callback({ type: "ERROR", error }));
        break;

      case "UPDATE":
        update(event.target, event.context, basket)
          .then(data => {
            callback({ type: "UPDATED", data });
            basket.refresh();
          })
          .catch(error => callback({ type: "ERROR", error }));
        break;

      case "SYNC":
        sync(event.target, event.context, basket)
          .then(data => {
            callback({ type: "SYNCED", data });
            basket.refresh();
          })
          .catch(error => callback({ type: "ERROR", error }));
        break;
    }
  });

  return () => {
    //  no need t odo anything here, as we are not doing any cleanup
  };
}

// --------------------------------------------------------
