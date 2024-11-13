// --- external
import { computed, ref, unref, toRaw } from "vue";
import { useRouter } from "vue-router";
import { useStorage } from "@vueuse/core";

// --- internal
import { useBasket } from "@upmind/client-vue";

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
import type { ProductModel } from "@upmind/headless";
import { stateMatches } from "../../../../packages/headless-vue/src/utils";

enum NextBasketItemTypes {
  PENDING = "pending",
  INVALID = "invalid",
  RELATED = "related",
}

// -----------------------------------------------------------------------------
export const usePendingBasketItems = () => {
  const router = useRouter();

  const subscriptions: Ref<null | Record<string, Subscription>> = ref({});

  const { isReady, addItem, itemsPending, productsInvalid, items, removeItem } =
    useBasket();

  const pendingBasketItems: Ref<null | Record<string, Object>> = useStorage(
    "pendingBasketItems",
    {},
    sessionStorage,
    { mergeDefaults: true } // <--
  );

  const products: Ref<string[]> = ref([]);

  // ---

  function cleanContext(state: State<any, any>) {
    return omit(get(state, "context.model"), "id"); // remove our id as we don't want to store this
  }

  function setItem(
    productId: string,
    context?: ProductModel | State<any, any>
  ) {
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
    const basketItem = find(items.value, ["id", id]);

    return new Promise((resolve, reject) => {
      if (basketItem) {
        resolve(basketItem);
      } else {
        reject("Basket item not found");
      }
    });
  }

  function unsetItem(productId: string) {
    products.value = reject(products.value, pid => pid == productId); // remember to remove the product from our list
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
      const basketItem = find(itemsPending.value, [
        "state.context.model.productId",
        productId,
      ]);

      if (!isEmpty(basketItem)) {
        return Promise.resolve(basketItem);
      } else {
        return addItem(model, { awaitStates: null }).catch(() => {
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
    // get any products from the url query params and store them in our pending basket items
    const { productConfigs } = useQueryParams();
    products.value = map(productConfigs, "productId");
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
  function getNextPendingItem() {
    let basketItem;

    if (products.value?.length) {
      const productId = first(products.value);
      basketItem = find(itemsPending.value, [
        "state.context.model.productId",
        productId,
      ]);
    } else {
      basketItem = first(itemsPending.value) as ActorRef<any, any>;
    }
    if (!basketItem) return null;

    const pid = get(basketItem, "state.context.model.productId");

    return {
      name: "productAdd",
      params: { pid },
    };
  }

  function getNextInvalidItem() {
    const basketItem = first(productsInvalid.value) as ActorRef<any, any>;

    if (!basketItem) return null;

    return {
      name: "productEdit",
      params: { bpid: basketItem.id },
    };
  }

  function getNextRelatedItem(currentBasketItem: ActorRef<any, any>) {
    // Related items ar when the current items provision fields
    // contain the service identifier of another basket item

    const provisionFields = get(
      currentBasketItem,
      "state.context.model.provisionFields",
      {}
    );

    if (isEmpty(provisionFields)) return null;

    const basketItem = find(items.value, item => {
      const serviceIdentifier = get(
        item,
        "state.context.lookups.product.serviceIdentifier"
      );

      if (!serviceIdentifier) return false;

      const value = includes(values(provisionFields), serviceIdentifier);
      const requiresAction = stateMatches(item, [
        "available.configuring",
        "available.configured",
        "available.error",
      ]);

      return value && requiresAction;
    });

    if (!basketItem) return null;

    return {
      name: "productEdit",
      params: { bpid: basketItem.id },
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
    const related =
      includes(types, NextBasketItemTypes.RELATED) &&
      currentBasketItem &&
      getNextRelatedItem(currentBasketItem);

    const pending =
      includes(types, NextBasketItemTypes.PENDING) && getNextPendingItem();

    const invalid =
      includes(types, NextBasketItemTypes.INVALID) && getNextInvalidItem();

    return related || pending || invalid || null;
  }

  const hasNextBasketItem = computed(() => {
    return (
      !isEmpty(pendingBasketItems.value) || !isEmpty(productsInvalid.value)
    );
  });

  const nextBasketItems = computed(() => {
    const items = map(
      concat(itemsPending.value, productsInvalid.value),
      item => {
        const product = get(item, "state.context.lookups.product");
        return {
          id: item.id,
          ...product,
        };
      }
    );

    return items;
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
    } else if (items.value.length) {
      router.replace({ name: "cart" }); // navigate to our cart page if all our products are configured
    } else {
      router.replace({ name: "empty" }); // navigate to our empty page if we have no products
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
    NextBasketItemTypes,
    nextBasketItems,
    hasNextBasketItem,
    navigateNextBasketItem,
    getNextBasketItem,
    getNextRelatedItem,
  };
};
