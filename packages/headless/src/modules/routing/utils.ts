// --- external

// --- internal

// --- utils
import {
  get,
  isEmpty,
  isArray,
  compact,
  isFunction,
  first,
  toNumber,
  includes,
  set,
  reduce,
  uniq,
  concat,
} from "lodash-es";

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";
import type { ProductModel } from "../product/types";
import type { Route } from "./types";
// -----------------------------------------------------------------------------

// vanilla js function to parse the current route, similar to vue-router

export const useRouteQueryParams = (route: Route) => {
  const { query, params } = route;
  // parse our  query/params that may be passed in as ARRAY
  function getParams(type: QUERY_PARAMS, fallback?: any) {
    const value = get(params, type, get(query, type, fallback));
    if (isEmpty(value)) return isFunction(fallback) ? fallback() : fallback;
    return compact(isArray(value) ? value : [value]);
  }

  // parse our query/params that may be passed in as STRING
  function getParam(type: QUERY_PARAMS, fallback?: any) {
    const value = get(params, type, get(query, type, fallback));
    if (isEmpty(value)) return isFunction(fallback) ? fallback() : fallback;
    return isArray(value) ? first(value) : value;
  }

  function getProductConfigs(): ProductModel[] {
    // This is a complex object that is passed in as a query param
    //  and is used to configure a product with multiple options, attributrs, etc.
    // NB: If ther eare multiple products, then we will have multiple configs, and we ASSUME the index alligns with the product index.
    // so for that we get the following query params.
    const productId = getParam(QUERY_PARAMS.PRODUCT_ID);

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

    const model = [
      {
        productId,
        quantity: productQty ? toNumber(productQty) : 1,
        term: bcm ? toNumber(bcm) : undefined,
        subproducts,
        provisionFields,
        coupons,
      },
    ];

    return model;
  }

  return {
    getParams,
    getParam,
    productId: getParam(QUERY_PARAMS.PRODUCT_ID),
    products: getParams(QUERY_PARAMS.PRODUCT_ID),
    productConfigs: getProductConfigs(),

    basketProductId: getParam(QUERY_PARAMS.BASKET_PRODUCT_ID),

    currency: getParam(
      QUERY_PARAMS.CURRENCY,
      getParam(QUERY_PARAMS.CURRENCY_CODE)
    ),
    coupon: getParam(QUERY_PARAMS.COUPONS),
  };
};
