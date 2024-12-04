// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from ".";
import productServices from "./products/services";

// --- utils
import {
  defaults,
  get,
  isArray,
  isEmpty,
  map,
  pick,
  pickBy,
  reduce,
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { IProduct } from "@upmind-automation/types";

// --------------------------------------------------------
async function load(context: any, basket: any) {
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
}

/**
 * Fetch a given product
 *
 * @param productId
 * @param context
 * @param basket
 * @returns {IProduct} // single product
 */
async function fetch(
  productId: string,
  context: any,
  basket: any
): Promise<IProduct[]> {
  if (isEmpty(productId)) return Promise.resolve([]);

  const data = { productId };
  const basketSnapshot = get(basket.getSnapshot(), "context.basket");

  return productServices.fetch(
    {
      basketId: basketSnapshot?.id,
      currencyId: basketSnapshot?.currency_id,
      promotions: basketSnapshot?.promotions,
    },
    { data }
  );
}

/**
 * Fetch related products for a given product
 *
 * @param productId
 * @param context
 * @param basket
 * @returns {IProduct[]} // array of related products
 */
async function fetchRelated(
  productId: string,
  context: any,
  basket: any
): Promise<IProduct[]> {
  if (isEmpty(productId)) return Promise.resolve([]);

  const data = defaults(pick(context, ["limit", "offset"]), {
    productId,
    limit: 10, // default limit
    offset: 0, // default/initial offset
  });

  const basketSnapshot = get(basket.getSnapshot(), "context.basket");

  return productServices.fetchRelated(
    {
      basketId: basketSnapshot?.id,
      currencyId: basketSnapshot?.currency_id,
      promotions: basketSnapshot?.promotions,
    },
    { data }
  );
}

/**
 * Fetch a given product
 *
 * @param productId
 * @param context
 * @param basket
 * @returns {IProduct} // single product
 */
async function fetchSelected(
  productIds: string[],
  context: any,
  basket: any
): Promise<IProduct[]> {
  if (isEmpty(productIds)) return Promise.resolve([]);

  const data = { productIds };
  const basketSnapshot = get(basket.getSnapshot(), "context.basket");
  return productServices.fetchSelected(
    {
      basketId: basketSnapshot?.id,
      currencyId: basketSnapshot?.currency_id,
      promotions: basketSnapshot?.promotions,
    },
    { data }
  );
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
  const basketId = basket.getBasketId();
  // ---
  return productServices.remove({ basketId, bpid: item.id });
}

async function update(item: any, context: any, basket: any) {
  if (isEmpty(item)) return Promise.resolve();
  const basketSnapshot = get(basket.getSnapshot(), "context.basket");

  // ---
  // const bpid = get(basketItem, "state.context.basketProduct.id");
  // ---
  return productServices.update(
    {
      basketId: basketSnapshot?.id,
      promotions: basketSnapshot?.promotions,
      currencyId: basketSnapshot?.currency_id,
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
              // console.error("sync basket helper", "ADD", "failed", item);
              return Promise.resolve(actor);
            }

            await waitFor(
              actor,
              actorState => {
                return actorState.matches("available.valid");
              },
              { timeout: 60_000 } // wait 1 min (max)
            );
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
        promotions: context?.promotions,
      },
      { data }
    );
  });
}

// --------------------------------------------------------

export function basketSubscription(callback: any, onReceive: any) {
  const basket = useBasket();

  let isRefreshing = false;

  // lets let our subscriber know when the basket has been refreshed
  basket.service.onTransition(state => {
    if (state.matches("shopping.refreshing.processing")) {
      isRefreshing = true;
    }

    if (isRefreshing && state.matches("shopping.refreshing.processed")) {
      isRefreshing = false;
      console.log("basketHelper", "onTransition", state.value);
      callback({ type: "REFRESH", data: state.context?.basket });
    }
  });

  onReceive((event: any) => {
    switch (event.type) {
      case "INIT":
      case "REFRESH":
        basket.isReady().then(() => {
          callback({
            type: "REFRESH",
            data: basket.getSnapshot()?.context?.basket,
          });
        });
        break;

      case "LOAD":
        load(event.context, basket)
          .then(data => callback({ type: "LOADED", data }))
          .catch(error => {
            // console.error("basketHelper", "LOAD", error);
            callback({ type: "ERROR", data: error });
          });
        break;

      case "FETCH":
        fetch(event.target, event.context, basket)
          .then(data => callback({ type: "FETCHED", data }))
          .catch(error => {
            // console.error("basketHelper", "LOAD", error);
            callback({ type: "ERROR", data: error });
          });
        break;

      case "FETCH_SELECTED":
        if (isEmpty(event.target)) {
          callback({ type: "FETCHED", data: [] });
          return;
        }
        fetchSelected(event.target, event.context, basket)
          .then(data => callback({ type: "FETCHED", data }))
          .catch(error => {
            // console.error("basketHelper", "FETCH_SELECTED", error);
            callback({ type: "ERROR", data: error });
          });
        break;

      case "FETCH_RELATED":
        fetchRelated(event.target, event.context, basket)
          .then(data => callback({ type: "FETCHED", data }))
          .catch(error => {
            // console.error("basketHelper", "FETCH_RELATED", error);
            callback({ type: "ERROR", data: error });
          });
        break;

      case "ADD":
        add(event.target, event.context, basket)
          .then(data => callback({ type: "ADDED", data }))
          .catch(error => {
            // console.error("basketHelper", "ADD", error);
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
            // console.error("basketHelper", "REMOVE", error);
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
            // console.error("basketHelper", "UPDATE", error);
            callback({ type: "ERROR", data: error });
            callback({ type: "CANCEL" });
          });

        break;

      case "SYNC":
        sync(event.target, event.context, basket)
          .catch(error => {
            // console.error("basketHelper", "SYNC", error);
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
