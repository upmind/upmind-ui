// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../basket";
import { useBasketProductsPending } from "./useBasketProductsPending";
import { useBasketProductPending } from "./useBasketProductPending";
import productServices from "./services";

import { useDataLayer, useI18n, useLocale } from "../system";
const { dataLayer } = useDataLayer();

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches
} from "../../utils";
import { defaults, get, isArray, isEmpty, map, pick, compact } from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { BasketProduct } from "./types";
import type { ActorRef } from "xstate";
import { watch } from "vue";

type BasketProductPending = ReturnType<typeof useBasketProductPending>;

// -----------------------------------------------------------------------------

export function basketSubscription(callback: any, onReceiveEvent: any) {
  const { t } = useI18n();
  const { locale } = useLocale();
  const basket = useBasket();
  const pendingProducts = useBasketProductsPending();

  let isRefreshing = false;
  let isLoading = false;

  // NB remember to refresh the basket and any subsequent actors if the locale changes
  watch(locale, (value, oldValue) => {
    if (!basket.basketId.value) return;
    callback({
      type: "REFRESH",
      data: basket.basket.value
    });
  });

  // let's let our subscriber know when the basket has been refreshed
  const subscription = basket.subscribe((state: any) => {
    // mark the basket as refreshing

    if (stateMatches(state, ["loading", "subscribing"])) isLoading = true;
    if (stateMatches(state, ["shopping.refreshing.processing"]))
      isRefreshing = true;

    // when the basket has been refreshed, then we can forward the refresh event
    if (
      (isLoading && stateMatches(state, ["shopping"])) ||
      (isRefreshing && stateMatches(state, ["shopping.refreshing.processed"]))
    ) {
      isRefreshing = false;
      isLoading = false;
      callback({ type: "REFRESH", data: state.context?.basket });
    }
  });

  //-- initialise our basket
  const onReceive = (event: any) => {
    if (event.type === "INIT") {
      basket
        .isReady()
        .then(() => {
          callback({
            type: "REFRESH",
            data: basket.basket.value
          });
        })
        .catch(() => {
          // console.error("basketHelper", "REFRESH", error);
          callback({
            type: "ERROR",
            data: basket.errors?.value
          });
        });
      return;
    }
    // --- from this point on we assume we have a basket

    const rawBasket = basket.basket.value;
    let basketProduct: BasketProduct | undefined;

    if (!rawBasket?.id) {
      // If no basket exists, refresh to create one, then retry the operation
      basket
        .refresh()
        .then(() => {
          // Re-trigger this event now that basket should exist
          onReceive(event);
        })
        .catch(() => {
          callback({
            type: "ERROR",
            data: new DetailedError(
              t("error.basket_not_available"),
              responseCodes.Not_Found,
              ErrorOrigin.Headless
            )
          });
        });
      return;
    }

    switch (event.type) {
      case "FETCH":
        if (isEmpty(event.target)) return Promise.resolve([]);

        const data = { productId: event.target };

        productServices
          .fetch(
            {
              basketId: rawBasket.id,
              currencyId: rawBasket.currency_id,
              promotions: event.context?.configuration?.coupons
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
              currencyId: rawBasket?.currency_id
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
              currencyId: rawBasket?.currency_id
            },
            {
              data: defaults(pick(event.context, ["limit", "offset"]), {
                productId: event.target,
                limit: 10, // default limit
                offset: 0 // default/initial offset
              })
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
                basket: basket.basket.value,
                context: event.context
              }
            });
          })
          .catch(error => {
            // console.error("basketHelper", "ADD", error);
            callback({ type: "ERROR", data: error });
            callback({
              type: "ADDED",
              data: { basket: basket.basket.value, context: event.context }
            });
          });
        break;

      case "ADD_UPDATE":
        pendingProducts
          .add(get(event.target, "productId"), { ...event.target })
          .then(async (instance: BasketProductPending) => {
            return waitFor(
              instance.service,
              actorState => actorState.matches("available.valid"),
              { timeout: 60_000 } // wait 1 min (max) for actor to be ready
            )
              .then(_state => {
                return instance;
              })
              .catch(() => {
                throw new DetailedError(
                  t("error.basket_product_add_failed"),
                  responseCodes.Timeout,
                  ErrorOrigin.Headless,
                  instance
                );
              });
          })
          .then((instance: BasketProductPending) => {
            const model = instance.model;
            const coupons = instance.coupons;
            const actor = instance.service;
            const product = instance.product;
            if (!product)
              throw new DetailedError(
                t("error.product_not_available"),
                responseCodes.Not_Found,
                ErrorOrigin.Headless
              );
            // tell the subscriber we are processing as well as the actor we spawned
            actor.send({ type: "PROCESSING" });
            callback({ type: "PROCESSING" });
            // try to update the actor we just added, using the parsed model
            productServices
              .update(
                {
                  basketId: rawBasket?.id,
                  promotions: coupons,
                  currencyId: rawBasket?.currency_id
                },
                { data: model.value! }
              )
              .then((rawBasket: IBasket) => {
                dataLayer({ event: "add_to_cart" })
                  .withItems(product.value!)
                  .push();
                return rawBasket;
              })
              .then((rawBasket: IBasket) => {
                actor.send({ type: "UPDATED", data: rawBasket });
                basket.refresh(rawBasket).then(() =>
                  callback({
                    type: "ADDED",
                    data: { actor, basket: rawBasket, context: event.context }
                  })
                );
              })
              .catch((data: any) => {
                actor.send({ type: "ERROR", data });

                // get just the error message and add the related basketItem (actor) to it
                const error = get(data, "error", {});

                callback({
                  type: "ERROR",
                  data: { ...error, basketItem: actor }
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
                  basketItem: actor
                }
              });
            }
            callback({ type: "CANCEL" });

            return actor;
          });

        break;

      case "ADD_UPDATE_MANY":
        const models = isArray(event.target) ? event.target : [event.target]; // safety check to ensure we have an array of models
        // First ensure all our models are added to the basket...
        // Then sync all our models with the basket
        if (isEmpty(models)) callback({ type: "UPDATED", data: [] });

        const promises = map(models, async model => {
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
                .catch(error => {
                  return undefined;
                });
            });
        }) as Promise<ActorRef<any>>[];

        // then update the basket
        Promise.all(promises)
          .then(async (instances: ActorRef<any>[]) => {
            return productServices
              .updateMany(
                {
                  basketId: rawBasket?.id,
                  basketProducts: basket.products.value
                },
                { data: compact(instances) }
              )
              .then(() => instances);
          })
          .then((instances: ActorRef<any>[]) => {
            // add the success event to the datalayer
            dataLayer({ event: "add_to_cart" })
              .withItems(
                compact(
                  map(instances, instance =>
                    get(instance.getSnapshot(), "context.product")
                  )
                )
              )
              .push();

            return instances;
          })
          .catch(error => {
            callback({ type: "ERROR", data: error });
          })

          .finally(() => {
            basket
              .refresh()
              .then((rawBasket?: IBasket) =>
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
              promotions: event.context?.coupons,
              currencyId: rawBasket?.currency_id
            },
            { data: event.target }
          )
          .then((rawBasket: IBasket) => {
            // add the success event to the datalayer
            // if (!event.target?.id) debugger;// TODo match agains tmodel if we dont have an id
            const basketProduct = basket.findProduct({ id: event.target.id });
            if (basketProduct) {
              dataLayer({ event: "add_to_cart" })
                .withItems(basketProduct)
                .push();
            }
            return rawBasket;
          })
          .then(_rawBasket => {
            return basket.refresh().then((rawBasket?: IBasket) => {
              callback({ type: "UPDATED", data: rawBasket });
              return rawBasket;
            });
          })
          .catch(error => {
            callback({ type: "ERROR", data: error });
            callback({ type: "CANCEL" });
          });

        break;

      case "REMOVE":
        basketProduct = basket.findProduct({ id: event.target.id });

        if (!basketProduct) {
          callback({
            type: "ERROR",
            data: new DetailedError(
              t("error.basket_product_not_found"),
              responseCodes.Not_Found,
              ErrorOrigin.Headless
            )
          });
          break;
        }

        callback({ type: "PROCESSING" });

        productServices
          .remove({
            basketId: rawBasket?.id,
            bpid: event.target.id
          })
          .then((_rawBasket: IBasket) => {
            if (basketProduct)
              dataLayer({ event: "remove_from_cart" })
                .withItems([basketProduct])
                .push();
          })
          .then(() => {
            basket
              .refresh()
              .then((rawBasket?: IBasket) =>
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
  };

  onReceiveEvent(onReceive);

  return () => {
    // when our  invoking manager is done, we should unsubscribe for any further updates
    subscription.unsubscribe();
  };
}
