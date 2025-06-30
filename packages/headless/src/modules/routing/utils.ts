// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../basket";
import { useBasketProductsPending } from "../basketProduct";

// --- utils
import {
  DetailedError,
  responseCodes,
  stateMatches,
  useSafeParse
} from "../../utils";
import {
  compact,
  concat,
  find,
  first,
  get,
  includes,
  isArray,
  isEmpty,
  isFunction,
  reduce,
  reject,
  set,
  toNumber,
  uniq,
  values
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { QUERY_PARAMS } from "@upmind-automation/types";
import type { ProductModel } from "../product";
import type { BasketProduct } from "../basketProduct";
import { REQUIRES_ACTION, type Route } from "./types";

// -----------------------------------------------------------------------------

export async function awaitResolved(service: ActorRef<any>) {
  return waitFor(service, state => stateMatches(state, "available.resolved"), {
    timeout: 60_000
  })
    .then(state => {
      return get(state, "context.currentRoute");
    })
    .catch(() => {
      throw new DetailedError(
        "[headless] awaitResolved on routing/utils timed out",
        responseCodes.Timeout
      );
    });
}

// vanilla js function to parse the current route, similar to vue-router
export const useRouteQueryParams = (route: Route) => {
  const { query, params } = route;

  // parse our  query/params that may be passed in as ARRAY
  function getParams(type: string, fallback?: any) {
    const value = get(params, type, get(query, type, fallback));
    if (isEmpty(value)) return isFunction(fallback) ? fallback() : fallback;
    return compact(isArray(value) ? value : [value]);
  }

  // parse our query/params that may be passed in as STRING
  function getParam(type: string, fallback?: any) {
    const value = get(params, type, get(query, type, fallback));
    if (isEmpty(value)) return isFunction(fallback) ? fallback() : fallback;
    return isArray(value) ? first(value) : value;
  }

  function getProductConfigs(): ProductModel[] {
    // This is a complex object that is passed in as a query param
    //  and is used to configure a product with multiple options, attributrs, etc.
    // NB: If ther eare multiple products, then we will have multiple configs, and we ASSUME the index alligns with the product index.
    // so for that we get the following query params.

    // NB: include LEGACY fallback for 'product' query param
    const productId = getParam(QUERY_PARAMS.PRODUCT_ID, getParam("product"));

    // if we dont have a product id, then we dont have a product config
    if (!productId) return [];

    const productQty = getParam(QUERY_PARAMS.QUANTITY);

    const bcm = getParam(QUERY_PARAMS.BILLING_CYCLE_MONTHS);
    // sub products
    const subproducts = reduce(
      query,
      (result, value, key) => {
        if (key == QUERY_PARAMS.SUBPRODUCT_IDS) {
          const values = value?.toString()?.split(",") as [];
          result.push(...values);
        }
        return uniq(concat(result));
      },
      []
    );

    // provision
    const provisionFields = reduce(
      query,
      (result, value, key) => {
        if (includes(key, QUERY_PARAMS.PRODUCT_FIELDS)) {
          const field = `${key
            .replace(`${QUERY_PARAMS.PRODUCT_FIELDS}[`, "")
            .replace("]", "")}`;
          set(result, field, value);
        }
        return result;
      },
      {}
    );

    // coupons
    const coupons = getParams(QUERY_PARAMS.COUPONS);

    // bundle
    const bundle = getParam("bundle");

    const model = [
      {
        productId,
        quantity: productQty ? toNumber(productQty) : 1,
        term: bcm ? toNumber(bcm) : undefined,
        subproducts,
        provisionFields,
        coupons,
        bundle
      }
    ];

    return model;
  }

  return {
    parse: useSafeParse,
    getParams,
    getParam,
    express: useSafeParse(getParam("express", false)) == true, // make sure we only return true if the value is actually true
    productId: getParam(QUERY_PARAMS.PRODUCT_ID),
    products: getParams(QUERY_PARAMS.PRODUCT_ID),
    productConfigs: getProductConfigs(),
    productConfig: first(getProductConfigs()),
    basketProductId: getParam(QUERY_PARAMS.BASKET_PRODUCT_ID),

    currency: getParam(
      QUERY_PARAMS.CURRENCY,
      getParam(QUERY_PARAMS.CURRENCY_CODE)
    ),
    coupon: getParam(QUERY_PARAMS.COUPONS),
    bundle: getParam("bundle")
  };
};

export const useRouteRequiresAction = () => {
  const { getProducts, getInvalidProducts, isReady } = useBasket();
  const { get: getPendingProducts } = useBasketProductsPending();

  function getNextPending(current?: ActorRef<any>) {
    const productsPending = reject(getPendingProducts(), ["id", current?.id]);
    return first(productsPending);
  }

  function getNextInvalid(current?: ActorRef<any>) {
    const pid = get(current, "state.context.model.productId", {});
    const products = reject(getInvalidProducts(), ["productId", pid]);
    const basketProduct = first(products);
    return basketProduct;
  }

  function getNextRelated(current: ActorRef<any>): undefined | BasketProduct {
    // Related items ar when the current items provision fields
    // contain the service identifier of another basket item
    const provisionFields = get(
      current?.getSnapshot(),
      "context.model.provisionFields",
      {}
    );
    if (isEmpty(provisionFields)) return;

    const basketProduct = find(getProducts(), basketProduct => {
      const serviceIdentifier = get(basketProduct, "serviceIdentifier");
      if (!serviceIdentifier) return false;
      const value = includes(values(provisionFields), serviceIdentifier);
      const hasError = !isEmpty(get(basketProduct, "errors"));
      return value && hasError;
    });

    return basketProduct;
  }

  function getNext(
    currentBasketItem?: ActorRef<any>,
    types: REQUIRES_ACTION[] = [
      REQUIRES_ACTION.PENDING,
      REQUIRES_ACTION.INVALID,
      REQUIRES_ACTION.RELATED
    ]
  ) {
    // if we are passed a current item we want to check for any related items
    // and  if they are pending or invalid we want to navigate to them
    // otherwise check for any pending or invalid items
    return (
      (includes(types, REQUIRES_ACTION.RELATED) &&
        currentBasketItem &&
        getNextRelated(currentBasketItem)) ||
      (includes(types, REQUIRES_ACTION.PENDING) &&
        getNextPending(currentBasketItem)) ||
      (includes(types, REQUIRES_ACTION.INVALID) &&
        getNextInvalid(currentBasketItem)) ||
      null
    );
  }

  return {
    isReady,
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    getProducts: () => getInvalidProducts(),
    hasProducts: () => !isEmpty(getInvalidProducts())
  };
};
