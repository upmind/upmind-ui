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
  concat,
  uniq,
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { IProduct } from "@upmind-automation/types";

// --------------------------------------------------------
async function load(context: any, basket: any) {
  const products = reduce(
    basket.getProducts(),
    (result: ActorRef<any, any>[], product) => {
      // check all our mapping values are set, if not then its not a valid mapping and we can skip it
      const mapping = context.basketItemMapper(product);
      const isValid = isEmpty(pickBy(mapping, isEmpty));
      if (isValid) {
        const data = context.itemBuilder(product);
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
      promotions: uniq(concat(basketSnapshot?.promotions, context?.promotions)),
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
      // promotions: uniq(concat(basketSnapshot?.promotions, context?.promotions)),
    },
    { data }
  );
}

/**
 * Add a new item to the basket
 *
 * @param model
 * @param context
 * @param basket
 * @returns {ActorRef<any, any>} XState Actor representing the new item
 */
async function add(
  model: any,
  context: any,
  basket: any
): Promise<ActorRef<any, any> | null> {
  if (isEmpty(model)) return Promise.resolve(null);

  const mapping = context.basketItemMapper(model);
  const basketItem = basket.findItem(mapping);
  if (basketItem) return Promise.resolve(basketItem); // its allready added, so we can skip it

  return basket.addItem(model);
}

async function remove(basketProduct: any, context: any, basket: any) {
  const basketId = basket.getBasketId();
  // ---
  return productServices.remove({ basketId, bpid: basketProduct.id });
}

async function update(model: any, context: any, basket: any) {
  if (isEmpty(model)) return Promise.resolve();
  const basketSnapshot = get(basket.getSnapshot(), "context.basket");

  // ---
  // const bpid = get(basketItem, "state.context.basketProduct.id");
  // ---
  return productServices.update(
    {
      basketId: basketSnapshot?.id,
      promotions: uniq(concat(basketSnapshot?.promotions, context?.promotions)),
      currencyId: basketSnapshot?.currency_id,
    },
    { data: model }
  );
}

async function sync(models: any, context: any, basket: any) {
  models = isArray(models) ? models : [models]; // safey check to ensure we have an array of models
  // First ensure all our models are added to the basket...
  // Then sync all our models with the basket
  const promises = isEmpty(models)
    ? [Promise.resolve([])]
    : map(models, model => {
        return add(model, context, basket).then(
          async (actor: ActorRef<any, any> | null) => {
            if (!actor) {
              // console.error("sync basket helper", "ADD", "failed", model);
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
  basket.service.onTransition((state: any) => {
    if (state.matches("shopping.refreshing.processing")) {
      isRefreshing = true;
    }

    if (isRefreshing && state.matches("shopping.refreshing.processed")) {
      isRefreshing = false;
      callback({ type: "REFRESH", data: state.context?.basket });
    }
  });

  onReceive((event: any) => {
    switch (event.type) {
      case "INIT":
      case "REFRESH":
        basket
          .isReady()
          .then(() => {
            callback({
              type: "REFRESH",
              data: basket.getSnapshot()?.context?.basket,
            });
          })
          .catch(error => {
            // console.error("basketHelper", "REFRESH", error);
            callback({ type: "ERROR", data: error });
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
          .then(data =>
            callback({ type: "FETCHED", data, context: event.context })
          )
          .catch(error => {
            // console.error("basketHelper", "LOAD", error);
            callback({ type: "ERROR", data: error, context: event.context });
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
          .then((actor: ActorRef<any, any> | null) =>
            callback({
              type: "ADDED",
              data: {
                actor,
                basket: basket.getSnapshot(),
                context: event.context,
              },
            })
          )
          .catch(error => {
            // console.error("basketHelper", "ADD", error);
            callback({ type: "ERROR", data: error });
            callback({
              type: "ADDED",
              data: { basket: basket.getSnapshot(), context: event.context },
            });
          });
        break;

      case "ADD_UPDATE":
        add(event.target, event.context, basket)
          .then((actor: ActorRef<any, any> | null) => {
            if (!actor) return Promise.reject("Failed to add item to basket");

            // wait for the actor to be ready to update
            // if it fails, then we will cancel update
            return waitFor(
              actor,
              actorState => {
                return actorState.matches("available.valid");
              },
              { timeout: 60_000 } // wait 1 min (max)
            )
              .then(() => actor)
              .catch(() => {
                return Promise.reject(actor);
              });
          })
          .then((actor: ActorRef<any, any>) => {
            // tell the subscriber we are processing as well as the actor we spawned
            actor.send({ type: "PROCESSING" });
            callback({ type: "PROCESSING" });
            const model = get(
              actor.getSnapshot(),
              "context.model",
              event.target
            );
            const context = get(actor.getSnapshot(), "context");
            // try to update the actor we just added
            // if it fails, then we will cancel update and return the error and
            return update(model, context, basket)
              .then(rawBasket => {
                // terminate the actor and refresh the basket
                actor.send({ type: "UPDATED", data: rawBasket });
                basket.refresh().then(() => {
                  // tell the subscriber we are done
                  callback({
                    type: "ADDED",
                    data: { actor, basket: rawBasket, context: event.context },
                  });
                });
              })
              .catch((data: any) => {
                actor.send({ type: "ERROR", data });

                // get just the error message and add the related basketItem (actor) to it
                const error = get(data, "error", {});

                callback({
                  type: "ERROR",
                  data: { ...error, basketItem: actor },
                });

                return actor;
              });
          })
          .catch((actor: any) => {
            if (actor?.getSnapshot) {
              callback({
                type: "ERROR",
                data: {
                  // title:"",
                  // message:"",
                  basketItem: actor,
                },
              });
            }
            callback({ type: "CANCEL" });

            return actor;
          });

        break;

      case "REMOVE":
        callback({ type: "PROCESSING" });
        remove(event.target, event.context, basket)
          .then(() => {
            basket.refresh().then(() => callback({ type: "REMOVED" }));
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
          .then(rawBasket => {
            basket
              .refresh()
              .then(() => callback({ type: "UPDATED", data: rawBasket }));
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
            basket
              .refresh()
              .then(() =>
                callback({ type: "SYNCED", data: basket.getProducts() })
              );
          });
        break;
    }
  });

  return () => {
    //  no need t odo anything here, as we are not doing any cleanup
  };
}

// --------------------------------------------------------
