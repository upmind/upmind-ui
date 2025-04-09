// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../basket";
import { useBasketProductsPending } from "./useBasketProductsPending";
import { useBasketProductPending } from "./useBasketProductPending";
import productServices from "./services";

import { useDataLayer } from "../system";
const { dataLayer } = useDataLayer();

// --- utils
import { parseEcommerceItem } from "../system/analytics/utils";
import { DetailedError, responseCodes } from "../../utils";
import {
  concat,
  defaults,
  get,
  isArray,
  isEmpty,
  map,
  pick,
  uniq,
  compact,
} from "lodash-es";
import { IBasket } from "@upmind-automation/types";

// --- types

type Basket = ReturnType<typeof useBasket>;
type BasketProductPending = ReturnType<typeof useBasketProductPending>;

// -----------------------------------------------------------------------------

export function basketSubscription(callback: any, onReceive: any) {
  const basket = useBasket();
  const pendingProducts = useBasketProductsPending();

  let isRefreshing = false;

  // lets let our subscriber know when the basket has been refreshed
  const subscription = basket.service.subscribe((state: any) => {
    // mark the basket as refreshing
    if (state.matches("shopping.refreshing.processing")) {
      isRefreshing = true;
    }

    // when the basket has been refreshed, then we can forward the refresh event
    if (isRefreshing && state.matches("shopping.refreshing.processed")) {
      isRefreshing = false;
      callback({ type: "REFRESH", data: state.context?.basket });
    }
  });

  onReceive((event: any) => {
    const rawBasket = basket.getBasket();

    if (!rawBasket) {
      callback({
        type: "ERROR",
        data: new DetailedError("Basket not found", responseCodes.Not_Found),
      });
      return;
    }

    switch (event.type) {
      case "INIT":
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

      case "FETCH":
        if (isEmpty(event.target)) return Promise.resolve([]);

        const data = { productId: event.target };
        productServices
          .fetch(
            {
              basketId: rawBasket.id,
              currencyId: rawBasket.currency_id,
              promotions: uniq(
                concat(rawBasket?.promotions, event.context?.promotions)
              ),
            },
            { data }
          )
          .then(data =>
            callback({ type: "FETCHED", data, context: event.context })
          )
          .catch(error =>
            callback({ type: "ERROR", data: error, context: event.context })
          );
        break;

      case "FETCH_SELECTED":
        if (isEmpty(event.target)) {
          callback({ type: "FETCHED", data: [] });
          return;
        }

        productServices
          .fetchSelected(
            {
              basketId: rawBasket?.id,
              currencyId: rawBasket?.currency_id,
              promotions: map(rawBasket?.promotions, "promotion.code"),
              // promotions: uniq(concat(rawBasket?.promotions, context?.promotions)),
            },
            { data: { productIds: event.target } }
          )
          .then(data =>
            callback({ type: "FETCHED", data, context: event.context })
          )
          .catch(error =>
            callback({ type: "ERROR", data: error, context: event.context })
          );
        break;

      case "FETCH_RELATED":
        if (isEmpty(event.target)) return Promise.resolve([]);

        productServices
          .fetchRelated(
            {
              basketId: rawBasket?.id,
              currencyId: rawBasket?.currency_id,
              promotions: map(rawBasket?.promotions, "promotion.code"),
            },
            {
              data: defaults(pick(event.context, ["limit", "offset"]), {
                productId: event.target,
                limit: 10, // default limit
                offset: 0, // default/initial offset
              }),
            }
          )

          .then(data =>
            callback({ type: "FETCHED", data, context: event.context })
          )
          .catch(error =>
            callback({ type: "ERROR", data: error, context: event.context })
          );
        break;

      case "ADD":
        pendingProducts
          .add(get(event.target, "productId"), event.target)
          .then((instance: BasketProductPending) => {
            callback({
              type: "ADDED",
              data: {
                actor: instance.service,
                basket: basket.getSnapshot(),
                context: event.context,
              },
            });
          })
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
        pendingProducts
          .add(get(event.target, "productId"), event.target)
          .then((instance: BasketProductPending) => {
            return waitFor(
              instance.service,
              actorState => actorState.matches("available.valid"),
              { timeout: 60_000 } // wait 1 min (max) for actor to be ready
            )
              .then(state => {
                return instance;
              })
              .catch(() => {
                // actor was not ready in time ( likely required additional configurtion),
                // so we reject the promise with the actor so we can continue to configure it
                return Promise.reject(instance);
              });
          })
          .then((instance: BasketProductPending) => {
            const actor = instance.service;
            // tell the subscriber we are processing as well as the actor we spawned
            actor.send({ type: "PROCESSING" });
            callback({ type: "PROCESSING" });
            const model = get(
              actor.getSnapshot(),
              "context.model",
              event.target
            );
            // try to update the actor we just added
            productServices
              .update(
                {
                  basketId: rawBasket?.id,
                  promotions: uniq(
                    concat(rawBasket?.promotions, event.context?.promotions)
                  ),
                  currencyId: rawBasket?.currency_id,
                },
                { data: event.target }
              )
              .then((rawBasket: IBasket) => {
                // add the success event to the datalayer
                debugger;
                dataLayer({ event: "add_to_cart" })
                  .withItems(map(rawBasket?.products, parseEcommerceItem))
                  .push();
                return rawBasket;
              })
              .then((rawBasket: IBasket) => {
                actor.send({ type: "UPDATED", data: rawBasket });
                basket.refresh(rawBasket).then(() =>
                  callback({
                    type: "ADDED",
                    data: { actor, basket: rawBasket, context: event.context },
                  })
                );
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

      case "ADD_UPDATE_MANY":
        const models = isArray(event.target) ? event.target : [event.target]; // safey check to ensure we have an array of models
        // First ensure all our models are added to the basket...
        // Then sync all our models with the basket
        if (isEmpty(models)) callback({ type: "UPDATED", data: [] });

        const promises = map(models, model => {
          return pendingProducts
            .add(model.productId, model, true)
            .then(async (instance: BasketProductPending) => {
              const actor = instance.service;
              return waitFor(
                actor,
                actorState => actorState.matches("available.valid"),
                { timeout: 60_000 } // wait 1 min (max)
              )
                .then(() => actor)
                .catch(() => undefined);
            });
        });

        // then update the basket
        Promise.all(promises)
          .then(data => {
            return productServices.updateMany(
              {
                basketId: basket.getBasketId(),
                basketProducts: basket.getProducts(),
                promotions: event.context?.promotions,
              },
              { data: compact(data) }
            );
          })
          .catch(error => callback({ type: "ERROR", data: error }))
          .finally(() => {
            basket
              .refresh()
              .then(rawBasket =>
                callback({ type: "UPDATED", data: rawBasket })
              );
          });
        break;

      case "UPDATE":
        callback({ type: "PROCESSING" });

        if (isEmpty(event.target)) {
          callback({ type: "CANCEL" });
        }

        // ---
        // const bpid = get(basketItem, "state.context.basketProduct.id");
        // ---
        productServices
          .update(
            {
              basketId: rawBasket?.id,
              promotions: uniq(
                concat(rawBasket?.promotions, event.context?.promotions)
              ),
              currencyId: rawBasket?.currency_id,
            },
            { data: event.target }
          )
          .then((rawBasket: IBasket) => {
            // add the success event to the datalayer
            debugger;
            dataLayer({ event: "add_to_cart" })
              .withItems(map(rawBasket?.products, parseEcommerceItem))
              .push();
            return rawBasket;
          })
          .then(rawBasket => {
            basket
              .refresh()
              .then(rawBasket =>
                callback({ type: "UPDATED", data: rawBasket })
              );
          })
          .catch(error => {
            callback({ type: "ERROR", data: error });
            callback({ type: "CANCEL" });
          });

        break;

      case "REMOVE":
        const basketProduct = basket.findProduct({ id: event.target.id });
        if (!basketProduct) {
          callback({
            type: "ERROR",
            data: new DetailedError(
              "Basket Product not found",
              responseCodes.Not_Found
            ),
          });
          break;
        }

        callback({ type: "PROCESSING" });

        productServices
          .remove({
            basketId: rawBasket?.id,
            bpid: basketProduct.id,
          })
          .then((rawBasket: IBasket) => {
            debugger;
            dataLayer({ event: "remove_from_cart" })
              .withItems(map(rawBasket?.products, parseEcommerceItem))
              .push();
          })
          .then(() => {
            basket
              .refresh()
              .then(rawBasket =>
                callback({ type: "REMOVED", data: rawBasket })
              );
          })
          .catch(error => {
            // console.error("basketHelper", "REMOVE", error);
            callback({ type: "ERROR", data: error });
            callback({ type: "CANCEL" });
          });

        break;
    }
  });

  return () => {
    // when our  invoking manager is done, we should unsubscribe for any further updates
    subscription.unsubscribe();
  };
}
