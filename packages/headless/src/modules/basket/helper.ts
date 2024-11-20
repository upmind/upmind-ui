// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from ".";
import productServices from "./items/services";

// --- utils
import {
  isFunction,
  get,
  isArray,
  isEmpty,
  map,
  pickBy,
  reduce,
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";

// --------------------------------------------------------
async function fetch(context: any, basket: any) {
  // // we need to ensure ALL our items are loaded before we can proceed
  // return waitFor(
  //   basket.service,
  //   state => {
  //     return every(
  //       state.context.items,
  //       actor => !actor?.state.matches("loading")
  //     );
  //   },
  //   {
  //     timeout: Infinity, // infinity = no timeout
  //   }
  // ).then(() => {
  const products = reduce(
    basket.getProducts(),
    (result, product) => {
      // check all our mapping values are set, if not then its not a valid mapping and we can skip it
      const mapping = context.basketItemMapper(product);
      const isValid = isEmpty(pickBy(mapping, isEmpty));
      if (isValid) {
        const data = context.itemBuilder(product);
        // @ts-ignore
        result.push(data);
      }

      return result;
    },
    []
  );
  return products;
  // });
}

/**
 * Add a new item to the basket
 *
 * @param item
 * @param context
 * @param basket
 * @returns {ActorRef<any, any>} XState Actor representing the new item
 */
async function add(
  item: any,
  context: any,
  basket: any
): Promise<ActorRef<any, any> | null> {
  if (isEmpty(item)) return Promise.resolve(null);

  const mapping = context.basketItemMapper(item);
  const basketItem = basket.findItem(mapping);
  if (basketItem) return Promise.resolve(basketItem); // its allready added, so we can skip it

  return basket.addItem(item);
}

async function remove(item: any, context: any, basket: any) {
  const mapping = context.basketItemMapper(item);
  const basketItem = basket.findItem(mapping);
  const basketId = basket.getBasketId();
  const id = get(basketItem, "state.context.basketProduct.id");
  // ---
  return productServices.remove({ basketId, id });
}

async function update(item: any, context: any, basket: any) {
  if (isEmpty(item)) return Promise.resolve();
  const basketSnapshot = get(basket.getSnapshot(), "context.basket");
  const mapping = context.basketItemMapper(item);
  const basketItem = basket.findItem(mapping);
  const pid = get(basketItem, "state.context.basketProduct.id");
  // ---
  if (!basketItem) return Promise.reject("No item found");
  // ---
  return productServices.update(
    {
      basketId: basketSnapshot?.id,
      basketProducts: basketSnapshot?.products,
      pid,
    },
    { data: item }
  );
}

async function sync(items: any, context: any, basket: any) {
  items = isArray(items) ? items : [items]; // safey check to ensure we have an array of items
  // First ensure all our items are added to the basket...
  // Then sync all our items with the basket
  const promises = isEmpty(items)
    ? [Promise.resolve([])]
    : map(items, item => {
        return add(item, context, basket).then(
          async (actor: ActorRef<any, any> | null) => {
            if (!actor) {
              console.error("sync basket helper", "ADD", "failed", item);
              return Promise.resolve(actor);
            }

            await waitFor(actor, actorState => {
              return actorState.matches("available.configured");
            });
            return actor;
          }
        );
      });

  // then update the basket
  return Promise.all(promises).then(data => {
    return productServices.sync(
      {
        basketId: basket.getBasketId(),
        basketProducts: basket.getProducts(),
      },
      { data }
    );
  });
}

// --------------------------------------------------------

export function basketSubscription(callback: any, onReceive: any) {
  const basket = useBasket();
  onReceive((event: any) => {
    switch (event.type) {
      case "FETCH":
        fetch(event.context, basket)
          .then(data => callback({ type: "FETCHED", data }))
          .catch(error => {
            console.error("basketHelper", "FETCH", error);
            callback({ type: "ERROR", data: error });
          });
        break;

      case "ADD":
        add(event.target, event.context, basket)
          .then(data => callback({ type: "ADDED", data }))
          .catch(error => {
            console.error("basketHelper", "ADD", error);
            callback({ type: "ERROR", data: error });
            callback({ type: "ADDED" });
          });
        break;

      case "REMOVE":
        callback({ type: "PROCESSING" });
        remove(event.target, event.context, basket)
          .then(() => {
            callback({ type: "REMOVED" });
            basket.refresh();
          })
          .catch(error => {
            console.error("basketHelper", "REMOVE", error);
            callback({ type: "ERROR", data: error });
            callback({ type: "CANCEL" });
          });

        break;

      case "UPDATE":
        callback({ type: "PROCESSING" });
        update(event.target, event.context, basket)
          .then(data => {
            callback({ type: "UPDATED", data });
            basket.refresh();
          })
          .catch(error => {
            console.error("basketHelper", "UPDATE", error);
            callback({ type: "ERROR", data: error });
            callback({ type: "CANCEL" });
          });

        break;

      case "SYNC":
        sync(event.target, event.context, basket)
          .catch(error => {
            console.error("basketHelper", "SYNC", error);
            callback({ type: "ERROR", data: error });
          })
          .finally(() => {
            const products = basket.getProducts();
            basket
              .refresh()
              .then(() => callback({ type: "SYNCED", data: products }));
          });
        break;
    }
  });

  return () => {
    //  no need t odo anything here, as we are not doing any cleanup
  };
}

// --------------------------------------------------------
