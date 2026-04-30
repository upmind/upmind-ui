// --- external

// --- internal
import { useBasket } from "../basket";
import { useBasketProductPending } from "./useBasketProductPending";
import productServices from "./services";

import { useI18n, useLocale } from "../system";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches
} from "../../utils";
import { defaults, isArray, isEmpty, pick } from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { BasketProduct } from "./types";
import { watch } from "vue";

// -----------------------------------------------------------------------------

export function basketSubscription(callback: any, onReceiveEvent: any) {
  const { t } = useI18n();
  const { locale } = useLocale();
  const basket = useBasket();

  let isRefreshing = false;
  let isLoading = false;

  // NB remember to refresh the basket and any subsequent actors if the locale changes
  watch(locale, (value, oldValue) => {
    if (!basket.basketId.value) return;
    callback({
      type: "REFRESH",
      data: { ...basket.basket.value, error: basket.errors.value }
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
      callback({
        type: "REFRESH",
        data: { ...state.context?.basket, error: state.context?.error }
      });
    }
  });

  //-- initialise our basket
  const onReceive = (event: any, meta: any) => {
    if (event.type === "INIT") {
      basket
        .isReady()
        .then(() => {
          callback({
            type: "REFRESH",
            data: { ...basket.basket.value, error: basket.errors.value }
          });
        })
        .catch(() => {
          callback({
            type: "REFRESH",
            data: { ...basket.basket.value, error: basket.errors.value }
          });
        });
      return;
    }
    // --- from this point on we assume we have a basket

    const rawBasket = basket.basket.value;

    switch (event.type) {
      case "FETCH":
        if (isEmpty(event.target)) return Promise.resolve([]);

        const data = { productId: event.target };

        productServices
          .fetch(
            {
              basketId: rawBasket?.id,
              currencyId: rawBasket?.currency_id,
              promotions: event.context?.configuration?.coupons
            },
            { data }
          )
          .then(data =>
            callback({ type: "FETCHED", data, sourceContext: event.context })
          )
          .catch(error =>
            callback({
              type: "ERROR",
              data: error,
              sourceContext: event.context
            })
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
            callback({ type: "FETCHED", data, sourceContext: event.context })
          )
          .catch(error =>
            callback({
              type: "ERROR",
              data: error,
              sourceContext: event.context
            })
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
            callback({ type: "FETCHED", data, sourceContext: event.context })
          )
          .catch(error =>
            callback({
              type: "ERROR",
              data: error,
              sourceContext: event.context
            })
          );
        break;

      case "UPDATE":
      case "ADD_UPDATE":
        callback({ type: "PROCESSING" });

        if (isEmpty(event.target))
          callback({ type: "CANCEL", data: event.target });

        return productServices
          .update(rawBasket?.id, event.target)
          .then((rawBasket: IBasket) =>
            callback({ type: "UPDATED", data: rawBasket })
          )
          .catch(error => {
            callback({
              type: "ERROR",
              data: error,
              sourceContext: event.target
            });
            callback({ type: "CANCEL", data: event.target });
          });

      case "ADD_UPDATE_MANY":
        let models = isArray(event.target) ? event.target : [event.target]; // safety check to ensure we have an array of models

        callback({ type: "PROCESSING" });

        if (isEmpty(event.target))
          callback({ type: "CANCEL", data: event.target });

        return productServices
          .updateMany(rawBasket?.id, basket.products.value ?? [], models)
          .then((rawBasket: IBasket) =>
            callback({ type: "UPDATED", data: rawBasket })
          )
          .catch(error => {
            callback({
              type: "ERROR",
              data: error,
              sourceContext: event.target
            });
            callback({ type: "CANCEL", data: event.target });
          });

      case "REMOVE":
        callback({ type: "PROCESSING" });
        if (!rawBasket?.id) {
          callback({
            type: "ERROR",
            data: new DetailedError(
              t("error.basket_not_available"),
              responseCodes.Not_Found,
              ErrorOrigin.Headless
            )
          });
          return;
        }

        productServices
          .remove(rawBasket.id, event.target.id)
          .then((rawBasket: IBasket) =>
            callback({ type: "UPDATED", data: rawBasket })
          )
          .catch(error => {
            callback({
              type: "ERROR",
              data: error,
              sourceContext: event.target
            });
            callback({ type: "CANCEL", data: event.target });
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
