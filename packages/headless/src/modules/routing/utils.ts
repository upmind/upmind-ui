// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../basket";

// --- utils
import {
  compact,
  concat,
  find,
  first,
  forEach,
  get,
  has,
  includes,
  isArray,
  isEmpty,
  isFunction,
  keys,
  map,
  merge,
  omit,
  reduce,
  reject,
  set,
  toNumber,
  uniq,
  unset,
  values,
} from "lodash-es";

// --- types
import type { ActorRef, State, Subscription } from "xstate";
import { QUERY_PARAMS } from "@upmind-automation/types";
import type { ProductModel } from "../product";
import type { BasketProduct } from "../basket";
import { ROUTE, REQUIRES_ACTION, type Route } from "./types";
import { responseCodes } from "../api";

// -----------------------------------------------------------------------------

export async function awaitResolved(service: ActorRef<any, any>) {
  return waitFor(service, state => ["resolved"].some(state.matches), {
    timeout: 60_000,
  }).then(state => get(state, "context.currentRoute"));
}

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

// -----------------------------------------------------------------------------

const useSessionStorage = () => {
  return {
    get(key: string, fallback: any) {
      const value = sessionStorage.getItem(key) || fallback || null;
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    },
    set(key: string, value: any) {
      sessionStorage.setItem(key, JSON.stringify(value));
      return value;
    },
    remove(key: string) {
      sessionStorage.removeItem(key);
      return null;
    },

    clear() {
      sessionStorage.clear();
      return null;
    },
  };
};

export const useRoutePendingProducts = (route: Route) => {
  const { productConfigs, basketProductId, productId } =
    useRouteQueryParams(route);
  const { addItem, getPendingProducts, getProducts, removeItem } = useBasket();
  const storage = useSessionStorage();
  const pendingProducts = storage.get("pendingProducts", {});
  // this is used to store subscriptions to changes on the product and update the local storage
  const subscriptions: Record<string, Subscription> = {};

  // setup our localstorage driver

  // --- utils

  async function ensureBasketItem(
    productId: string,
    model: any
  ): Promise<ActorRef<any, any>> {
    if (productId) {
      const productsPending = getPendingProducts();
      const basketItem = find(productsPending, [
        "state.context.model.productId",
        productId,
      ]);
      if (!isEmpty(basketItem)) {
        return Promise.resolve(basketItem);
      } else {
        return addItem(model)
          .then(async actor => {
            return waitFor(
              actor,
              state => !["loading", "subscribing"].some(state.matches),
              { timeout: Infinity }
            ).then(state =>
              !state.matches("error") ? actor : Promise.reject()
            );
          })
          .catch(() => {
            unsetPendingProduct(productId);
            return Promise.reject({
              message: "Error adding item to basket",
              code: responseCodes.Unprocessable_Entity,
            });
          });
      }
    } else {
      return Promise.reject("No product id found");
    }
  }

  // ---

  async function getBasketProduct(bpid?: string): Promise<ActorRef<any, any>> {
    const target = bpid || basketProductId;
    const products = getProducts();
    const basketItem = find(products, ["id", target]) as
      | ActorRef<any, any>
      | undefined;

    return new Promise((resolve, reject) => {
      if (basketItem) {
        resolve(basketItem);
      } else {
        reject({
          message: "Basket item not found",
          code: responseCodes.Not_Found,
        });
      }
    });
  }

  async function getPendingProduct(
    pid?: string,
    sync?: boolean
  ): Promise<ActorRef<any, any>> {
    let basketItem: ActorRef<any, any> | undefined;
    const target = pid || productId || first(keys(pendingProducts));

    if (target) {
      basketItem = await ensureBasketItem(
        target,
        get(pendingProducts, target, { target })
      );

      if (basketItem && sync) {
        const subscription: Subscription = basketItem.subscribe(
          (state: State<any, any>) => {
            if (state.matches("error")) {
              unsetPendingProduct(target);
              removeItem(basketItem?.id);
            } else if (state.matches("available.configuring")) {
              setPendingProduct(target, state);
            }
          }
        );

        set(subscriptions, target, subscription);
      }
    }
    return new Promise((resolve, reject) => {
      if (basketItem) {
        resolve(basketItem);
      } else {
        // if we get here, then we dont have any pending products
        reject({
          message: "No pending product found",
          code: responseCodes.Not_Found,
        });
      }
    });
  }

  function setPendingProduct(
    productId: string,
    value?: ProductModel | State<any, any>
  ) {
    // defensive
    if (!productId) return;

    const model = value
      ? has(value, "productId")
        ? value
        : omit(get(value, "context.model"), "id")
      : { productId };

    set(pendingProducts, productId, model);
    storage.set("pendingProducts", pendingProducts);
  }

  function unsetPendingProduct(productId: string) {
    unset(pendingProducts, productId);
    storage.set("pendingProducts", pendingProducts);

    // ensure we unsubscribe from the item if it exists
    const sub = get(subscriptions, productId);
    sub?.unsubscribe();
  }

  function syncPendingProducts(): Promise<ActorRef<any, any>>[] {
    // get any productIds from the url query params and store them in our pending basket items
    forEach(productConfigs, (product: ProductModel) => {
      // theres a chance we alrady have this product in our pending basket items
      // so we merge the existing product with the new product so we dont lose any data
      const existingProduct = get(pendingProducts, product.productId);
      setPendingProduct(product.productId, merge(existingProduct, product));
    });
    const promises = map(pendingProducts.value, (model, productId) => {
      return ensureBasketItem(productId, model).then(
        (basketItem: ActorRef<any, any>) => {
          setPendingProduct(productId, basketItem?.getSnapshot()); // update our pending basket items with the new value
          return basketItem;
        }
      );
    });

    return promises;
  }

  // ---

  return {
    getBasketProduct,
    hasPendingProducts: () => !isEmpty(pendingProducts),
    getPendingProduct,
    setPendingProduct,
    unsetPendingProduct,
    // ---
    syncPendingProducts,
  };
};

export const useRouteRequiresAction = () => {
  const { getPendingProducts, getProducts, getInvalidProducts } = useBasket();

  function getNextPending(current?: ActorRef<any, any>) {
    const productsPending = reject(getPendingProducts(), ["id", current?.id]);
    const pendingProduct = first(productsPending) as ActorRef<any, any>;

    if (!pendingProduct) return;

    return {
      name: ROUTE.PRODUCT_ADD,
      params: { pid: get(pendingProduct, "state.context.model.productId") },
    };
  }

  function getNextInvalid(current?: ActorRef<any, any>) {
    const pid = get(current, "state.context.model.productId", {});
    const products = reject(getInvalidProducts(), ["productId", pid]);
    const basketProduct = first(products);

    if (!basketProduct) return;

    return {
      name: ROUTE.PRODUCT_EDIT,
      params: { bpid: basketProduct.id },
    };
  }

  function getNextRelated(current?: ActorRef<any, any>) {
    // Related items ar when the current items provision fields
    // contain the service identifier of another basket item
    const provisionFields = get(
      current,
      "state.context.model.provisionFields",
      {}
    );

    if (isEmpty(provisionFields)) return;

    const basketProduct = find(getProducts(), basketProduct => {
      debugger;
      const serviceIdentifier = get(basketProduct, "product.serviceIdentifier");
      if (!serviceIdentifier) return false;
      const value = includes(values(provisionFields), serviceIdentifier);
      const hasError = !!get(basketProduct, "error");
      return value && hasError;
    });

    if (!basketProduct) return;

    return {
      name: ROUTE.PRODUCT_EDIT,
      params: { bpid: basketProduct.id },
    };
  }

  function getNext(
    currentBasketItem?: ActorRef<any, any>,
    types: REQUIRES_ACTION[] = [
      REQUIRES_ACTION.PENDING,
      REQUIRES_ACTION.INVALID,
      REQUIRES_ACTION.RELATED,
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
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    getProducts: () => {
      const pendingProducts = getPendingProducts();
      const invalidProducts = getInvalidProducts();
      return concat(pendingProducts, invalidProducts);
    },
  };
};
