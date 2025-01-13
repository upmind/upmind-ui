// --- external
import { computed, ref, unref, toRaw } from "vue";
import { useRouter } from "vue-router";
import { useStorage } from "@vueuse/core";

// --- internal
import { useBasket } from "../modules/basket";

// --- utils
import { useQueryParams } from "./useQueryParams";

import {
  concat,
  find,
  first,
  forEach,
  get,
  has,
  includes,
  isEmpty,
  map,
  merge,
  omit,
  reject,
  set,
  unset,
  values,
} from "lodash-es";

// --- types
import type { Ref } from "vue";
import type { ActorRef, State, Subscription } from "xstate";
import type { BasketProduct, ProductModel } from "@upmind-automation/headless";

enum NextBasketItemTypes {
  PENDING = "pending",
  INVALID = "invalid",
  RELATED = "related",
}

// -----------------------------------------------------------------------------
export const usePendingBasketItems = () => {
  const router = useRouter();
  const { productId, basketProductId, productConfigs } = useQueryParams();

  const subscriptions: Ref<null | Record<string, Subscription>> = ref({});

  const {
    isReady,
    addItem,
    productsPending,
    productsInvalid,
    products,
    removeItem,
  } = useBasket();

  const pendingBasketItems: Ref<null | Record<string, Object>> = useStorage(
    "pendingBasketItems",
    {},
    sessionStorage,
    { mergeDefaults: true } // <--
  );

  const productIds: Ref<string[]> = ref([]);

  // ---

  function cleanContext(state: State<any, any>) {
    return omit(get(state, "context.model"), "id"); // remove our id as we don't want to store this
  }

  function setItem(
    productId: string,
    context?: ProductModel | State<any, any>
  ) {
    // defensive
    if (!productId) return;

    const model = context
      ? has(context, "productId")
        ? context
        : cleanContext(context as State<any, any>)
      : { productId };

    const newBasketItems = toRaw(unref(pendingBasketItems)) || {};
    set(newBasketItems, productId, model);
    pendingBasketItems.value = null;
    if (newBasketItems) pendingBasketItems.value = newBasketItems;
  }

  async function getItem(
    productId: string,
    sync?: boolean
  ): Promise<ActorRef<any, any>> {
    await isReady();

    return ensureBasketItem(
      productId,
      get(pendingBasketItems.value, productId, { productId })
    ).then((basketItem: ActorRef<any, any>) => {
      if (sync) syncBasketItem(productId, basketItem);
      return basketItem;
    });
  }

  async function getBasketItem(id: string): Promise<ActorRef<any, any>> {
    await isReady();
    // if(!meta.is){router.replace({ name: "empty" });}

    const basketItem = find(products.value, ["id", id]);

    return new Promise((resolve, reject) => {
      if (basketItem) {
        resolve(basketItem);
      } else {
        reject("Basket item not found");
      }
    });
  }

  function unsetItem(productId: string) {
    productIds.value = reject(productIds.value, pid => pid == productId); // remember to remove the product from our list
    const newBasketItems = toRaw(unref(pendingBasketItems));
    unset(newBasketItems, productId);
    pendingBasketItems.value = null;
    if (newBasketItems) pendingBasketItems.value = newBasketItems;

    // ensure we unsubscribe from the item if it exists
    if (subscriptions.value?.[productId])
      subscriptions.value[productId].unsubscribe();
  }

  // ---

  async function ensureBasketItem(
    productId: string,
    model: any
  ): Promise<ActorRef<any, any>> {
    if (productId) {
      const basketItem = find(productsPending.value, [
        "state.context.model.productId",
        productId,
      ]);
      if (!isEmpty(basketItem)) {
        return Promise.resolve(basketItem);
      } else {
        return addItem(model, { awaitStates: null })
          .then((actor: ActorRef<any, any>) => {
            return actor;
          })
          .catch(() => {
            console.error("error adding pending item to basket", {
              productId,
              model,
            });
            unsetItem(productId);
            return Promise.reject("Error adding item to basket");
          });
      }
    } else {
      return Promise.reject("No product id found");
    }
  }

  function syncBasketItem(productId: string, basketItem: ActorRef<any, any>) {
    if (!basketItem) return;
    const subscription: Subscription = basketItem.subscribe(
      (state: State<any, any>) => {
        if (state.matches("error")) {
          unsetItem(productId);
          removeItem(basketItem.id);
        } else if (state.matches("available.configuring")) {
          setItem(productId, state);
        }
      }
    );

    subscriptions.value ??= {}; // ensure we have a subscriptions object
    set(subscriptions.value, productId, subscription);
  }

  function syncPendingBasketItems(): Promise<ActorRef<any, any>>[] {
    // get any productIds from the url query params and store them in our pending basket items
    productIds.value = map(productConfigs, "productId");
    forEach(productConfigs, (product: ProductModel) => {
      // theres a chance we alrady have this product in our pending basket items
      // so we merge the existing product with the new product so we dont lose any data
      const existingProduct = get(pendingBasketItems.value, product.productId);
      setItem(product.productId, merge(existingProduct, product));
    });

    const promises = map(pendingBasketItems.value, (model, productId) => {
      return ensureBasketItem(productId, model).then(
        (basketItem: ActorRef<any, any>) => {
          setItem(productId, basketItem?.getSnapshot()); // update our pending basket items with the new value
          return basketItem;
        }
      );
    });

    return promises;
  }

  // ---

  // navigate to the next basket item that needs configuring
  // prioritising url query params over pending basket items
  function getNextPendingItem(currentBasketItem?: ActorRef<any, any>) {
    const products = reject(productsPending.value, [
      "id",
      currentBasketItem?.id,
    ]);

    let basketItem;
    if (productIds.value?.length) {
      const productId = first(productIds.value);
      basketItem = find(products, ["state.context.model.productId", productId]);
    } else {
      basketItem = first(products) as ActorRef<any, any>;
    }
    if (!basketItem) return null;

    const pid = get(basketItem, "state.context.model.productId");
    return {
      name: "product.add",
      params: { pid },
    };
  }

  function getNextInvalidItem(currentBasketItem?: ActorRef<any, any>) {
    const productId = get(
      currentBasketItem,
      "state.context.model.productId",
      {}
    );

    const products = reject(productsInvalid.value, ["productId", productId]);
    const basketItem = first(products) as BasketProduct;
    if (!basketItem) return null;
    return {
      name: "product.edit",
      params: { bpid: basketItem.id },
    };
  }

  function getNextRelatedItem(currentBasketItem?: ActorRef<any, any>) {
    // Related items ar when the current items provision fields
    // contain the service identifier of another basket item

    const provisionFields = get(
      currentBasketItem,
      "state.context.model.provisionFields",
      {}
    );

    if (isEmpty(provisionFields)) return null;

    const product = find(products.value, basketProduct => {
      const serviceIdentifier = get(basketProduct, "product.serviceIdentifier");
      if (!serviceIdentifier) return false;
      const value = includes(values(provisionFields), serviceIdentifier);
      const hasError = !isEmpty(basketProduct?.error);
      return value && hasError;
    });

    if (!product) return null;

    return {
      name: "product.edit",
      params: { bpid: product.id },
    };
  }

  function getNextBasketItem(
    currentBasketItem?: ActorRef<any, any>,
    types: NextBasketItemTypes[] = [
      NextBasketItemTypes.PENDING,
      NextBasketItemTypes.INVALID,
      NextBasketItemTypes.RELATED,
    ]
  ) {
    // if we are passed a current item we want to check for any related items
    // and  if they are pending or invalid we want to navigate to them
    // otherwise check for any pending or invalid items
    return (
      (includes(types, NextBasketItemTypes.RELATED) &&
        currentBasketItem &&
        getNextRelatedItem(currentBasketItem)) ||
      (includes(types, NextBasketItemTypes.PENDING) &&
        getNextPendingItem(currentBasketItem)) ||
      (includes(types, NextBasketItemTypes.INVALID) &&
        getNextInvalidItem(currentBasketItem)) ||
      null
    );
  }

  const meta = computed(() => {
    return {
      hasInvalidBasketItems: !isEmpty(invalidBasketItems.value),
      hasNextBasketItem:
        !isEmpty(invalidBasketItems.value) ||
        !isEmpty(pendingBasketItems.value) ||
        !isEmpty(productsInvalid.value),
    };
  });

  const invalidBasketItems = computed(() => {
    // NB exclude our current product Id from the pending basket items
    const pending = reject(
      map(productsPending.value, item => {
        const product = get(item, "state.context.lookups.product");
        return {
          id: item.id,
          ...product,
        };
      }),
      ["state.context.model.productId", productId]
    );

    // NB exclude our current basket product Id from the invalid basket items,
    const invalid = reject(
      map(productsInvalid.value, product => {
        return product;
      }),
      ["id", basketProductId]
    );

    return concat(pending, invalid);
  });

  function navigateNextBasketItem(
    currentBasketItem?: ActorRef<any, any>,
    types: NextBasketItemTypes[] = [
      NextBasketItemTypes.PENDING,
      NextBasketItemTypes.INVALID,
      NextBasketItemTypes.RELATED,
    ]
  ) {
    const nextBasketItem = getNextBasketItem(currentBasketItem, types);
    if (nextBasketItem) {
      router.replace(nextBasketItem); // navigateNextBasketItem to our firs tproduct that needs configuring
    } else if (products.value.length) {
      router.replace({ name: "cart" }); // navigate to our cart page if all our productIds are configured
      // router.replace({ name: "checkout" }); // navigate to our checkout page if all our productIds are configured
    } else {
      router.replace({ name: "empty" }); // navigate to our empty page if we have no productIds
    }
  }

  // ---

  // ---

  return {
    getItem,
    getBasketItem,
    setItem,
    unsetItem,
    // ---
    syncPendingBasketItems,
    // ---
    meta,
    NextBasketItemTypes,
    invalidBasketItems,
    navigateNextBasketItem,
    getNextBasketItem,
    getNextRelatedItem,
  };
};
