// --- external
import { router } from "../routing";

// --- utils

// --- types

// --- utils
import { useSafeParse } from "../../utils";
import {
  compact,
  concat,
  first,
  forEach,
  get,
  includes,
  isArray,
  isEmpty,
  isFunction,
  reduce,
  set,
  toNumber,
  uniq
} from "lodash-es";

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";
import type { ProductProps } from "../product";
import type { RouteLocation } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Module-level batch queue for `unsetParam` deletions.
 * Multiple `consumeParam`/`unsetParam` calls within the same synchronous tick
 * (e.g. inside XState's scheduler loop) are coalesced into a single
 * `history.replaceState` via `queueMicrotask`, preventing Safari's
 * 100-calls-per-10-seconds SecurityError.
 */
const pendingDeletions = new Set<string>();
let flushScheduled = false;

function flushParamDeletions(): void {
  flushScheduled = false;
  if (pendingDeletions.size === 0) return;

  const url = new URL(window.location.href);
  const original = url.toString();

  forEach([...pendingDeletions], type => {
    url.searchParams.delete(type);
  });
  pendingDeletions.clear();

  if (url.toString() !== original) {
    history.replaceState(history.state, "", url);
  }
}

function scheduleParamDeletion(type: string): void {
  pendingDeletions.add(type);
  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(flushParamDeletions);
  }
}

// -----------------------------------------------------------------------------

/**
 * Composable function to manage query parameters from a specified or current route.
 *
 * The `useQueryParams` function retrieves the query parameters for a given route.
 * If no route is provided, the function will default to using the current route.
 * It ensures that the route object has safe defaults for its properties
 * including `name`, `path`, `query`, and `params`.
 */

export const useQueryParams = (route?: RouteLocation) => {
  const safeRoute = route ??
    router?.currentRoute?.value ?? {
      name: undefined,
      params: undefined,
      path: window.location.pathname,
      query: Object.fromEntries(
        new URLSearchParams(window.location?.search).entries()
      ),
      hash: window.location.hash
    };

  // parse our  query/params that may be passed in as ARRAY
  function getParams(type: string, fallback?: any) {
    const { query, params } = safeRoute;

    const value = get(params, type, get(query, type, fallback));
    if (isEmpty(value)) return isFunction(fallback) ? fallback() : fallback;
    return compact(isArray(value) ? value : [value]);
  }

  // parse our query/params that may be passed in as STRING
  function getParam(type: string, fallback?: any) {
    const { query, params } = safeRoute;

    const value = get(params, type, get(query, type, fallback));

    if (isEmpty(value)) return isFunction(fallback) ? fallback() : fallback;

    return useSafeParse(isArray(value) ? first(value) : value);
  }

  function consumeParam(type: string, fallback?: any) {
    const value = getParam(type, fallback);

    unsetParam(type);
    return value;
  }

  function setParam(type: string, value?: string | null, replace = false) {
    const updateRoute = replace ? router.replace : router.push;

    if (value) {
      updateRoute({
        query: {
          ...router.currentRoute.value.query,
          [type]: value
        }
      });
      return;
    } else {
      updateRoute({
        query: {
          ...router.currentRoute.value.query,
          [type]: undefined
        }
      });
      return;
    }
  }

  function unsetParam(type: string) {
    const url = new URL(window.location.toString());
    if (url.searchParams.has(type)) {
      scheduleParamDeletion(type);
    }
  }

  function getProductConfigs(): ProductProps[] {
    const { query } = safeRoute;

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

    const currencyCode = getParam(
      QUERY_PARAMS.CURRENCY,
      getParam(QUERY_PARAMS.CURRENCY_CODE)
    );

    const currencyId = getParam(QUERY_PARAMS.CURRENCY_ID);

    // bundle
    const bundle = getParam("bundle");

    const model: ProductProps[] = [
      {
        productId,
        quantity: productQty ? toNumber(productQty) : 1,
        term: bcm ? toNumber(bcm) : undefined,
        subproducts,
        provisionFields,
        coupons,
        bundle,
        currencyCode,
        currencyId
      }
    ];

    return model;
  }

  return {
    route: safeRoute,
    parse: useSafeParse,
    getParams,
    getParam,
    consumeParam,
    setParam,
    unsetParam,
    productId: getParam(QUERY_PARAMS.PRODUCT_ID, getParam("product")),
    products: getParams(QUERY_PARAMS.PRODUCT_ID, getParams("product")),
    productConfigs: getProductConfigs(),
    productConfig: first(getProductConfigs()),
    basketProductId: getParam(QUERY_PARAMS.BASKET_PRODUCT_ID),
    categoryId: getParam(QUERY_PARAMS.CATEGORY_ID),
    // ---
    currency: consumeParam(
      QUERY_PARAMS.CURRENCY,
      consumeParam(QUERY_PARAMS.CURRENCY_CODE)
    ),
    coupon: getParam(QUERY_PARAMS.COUPONS),
    bundle: consumeParam("bundle")
  };
};

export type RouteQueryParams = typeof useQueryParams;
