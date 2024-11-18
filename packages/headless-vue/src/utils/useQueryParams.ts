// --- external
import { useRoute } from "vue-router";

// --- internal

// --- utils
import {
  get,
  isEmpty,
  isArray,
  compact,
  isFunction,
  first,
  map,
  toNumber,
  includes,
  set,
  reduce,
  uniq,
  concat,
} from "lodash-es";

// --- types
export enum QUERY_PARAMS {
  ABORT = "abort",
  ACCOUNT_ID = "aid",
  ATTEMPT = "attempt",
  AUTHORIZATION_UUID = "authorization_uuid",
  AUTO_PAY = "auto_pay",
  BASKET_ID = "bid",
  BASKET_PRODUCT_ID = "bpid",
  BILLING_CYCLE_MONTHS = "bcm",
  CATEGORY_ID = "catid",
  CLIENT_ID = "client_id",
  COUPONS = "coupons",
  CROSS_SELL_PRODUCT = "csp",
  CURRENCY = "curr",
  CURRENCY_CODE = "currency",
  CURRENCY_ID = "currId",
  DATE = "date",
  EMAIL_ID = "email_id",
  FAILED = "failed",
  GATEWAY_PROVIDER_ID = "gpid",
  HASH = "hash",
  INIT = "init",
  INIT_PAY = "init_pay",
  MODAL_REQUEST_ID = "modal_request_id",
  OPERATION_ID = "operation_id",
  ORDER_ID = "oid",
  ORDER_TEMPLATE_CODE = "order_template_code",
  PAYMENT_DETAILS_ID = "payment_details_id",
  PAYMENT_METHOD_TYPE = "pmt",
  PAYMENT_SUCCESS = "payment_success",
  PRODUCT_FIELDS = "pfields",
  PRODUCT_ID = "pid",
  PRODUCT = "product",
  QUANTITY = "qty",
  READ_MORE = "read_more",
  SEARCH = "search",
  STORE_SUCCESS = "store_success",
  SUBPRODUCT_IDS = "sub_pids",
  SUBPRODUCT_QUANTITY = "subproduct_qty",
  SUCCESS = "success",
  USERNAME = "username",
  VIEW = "view",
}
import type { ProductModel } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useQueryParams = () => {
  const { query, params } = useRoute();

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
    const productIds = getParams(
      QUERY_PARAMS.PRODUCT,
      getParams(QUERY_PARAMS.PRODUCT_ID)
    );
    const productQty = getParams(QUERY_PARAMS.QUANTITY);

    const bcm = getParams(QUERY_PARAMS.BILLING_CYCLE_MONTHS);

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
    const promotions = getParams(QUERY_PARAMS.COUPONS);

    return map(
      productIds,
      (productId, index): ProductModel => ({
        productId,
        quantity: toNumber(productQty?.[index]),
        term: toNumber(bcm?.[index]),
        subproducts,
        provisionFields,
        promotions,
      })
    );
  }

  return {
    getParams,
    getParam,
    product_id: getParam(
      QUERY_PARAMS.PRODUCT_ID,
      getParam(QUERY_PARAMS.PRODUCT_ID)
    ),
    products: getParams(
      QUERY_PARAMS.PRODUCT,
      getParams(QUERY_PARAMS.PRODUCT_ID)
    ),
    productConfigs: getProductConfigs(),

    basketItemId: getParam(QUERY_PARAMS.BASKET_PRODUCT_ID),

    currency: getParam(
      QUERY_PARAMS.CURRENCY,
      getParam(QUERY_PARAMS.CURRENCY_CODE)
    ),
    coupon: getParam(QUERY_PARAMS.COUPONS),
  };
};
