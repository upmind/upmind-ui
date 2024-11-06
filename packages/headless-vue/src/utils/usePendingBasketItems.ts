// --- external
import { computed, ref, unref, toRaw } from "vue";
import { useRouter } from "vue-router";
import { useStorage } from "@vueuse/core";

// --- internal
import { useBasket } from "@upmind/client-vue";

// --- utils
import { useQueryParams } from "./useQueryParams";

import {
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
import type { IProductModel } from "@upmind/headless";
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

  const { isReady, addItem, itemsPending, itemsInvalid, items, removeItem } =
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
    product_id: string,
    context?: IProductModel | State<any, any>
  ) {
    const model = context
      ? has(context, "product_id")
        ? context
        : cleanContext(context as State<any, any>)
      : { product_id };
    const newBasketItems = toRaw(unref(pendingBasketItems)) || {};
    set(newBasketItems, product_id, model);
    pendingBasketItems.value = null;
    if (newBasketItems) pendingBasketItems.value = newBasketItems;
  }

  async function getItem(
    product_id: string,
    sync?: boolean
  ): Promise<ActorRef<any, any>> {
    await isReady();

    return ensureBasketItem(
      product_id,
      get(pendingBasketItems.value, product_id, { product_id })
    ).then((basketItem: ActorRef<any, any>) => {
      if (sync) syncBasketItem(product_id, basketItem);
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

  function unsetItem(product_id: string) {
    products.value = reject(products.value, pid => pid == product_id); // remember to remove the product from our list
    const newBasketItems = toRaw(unref(pendingBasketItems));
    unset(newBasketItems, product_id);
    pendingBasketItems.value = null;
    if (newBasketItems) pendingBasketItems.value = newBasketItems;

    // ensure we unsubscribe from the item if it exists
    if (subscriptions.value?.[product_id])
      subscriptions.value[product_id].unsubscribe();
  }

  // ---

  async function ensureBasketItem(
    product_id: string,
    model: any
  ): Promise<ActorRef<any, any>> {
    if (product_id) {
      const basketItem = find(itemsPending.value, [
        "state.context.model.product_id",
        product_id,
      ]);

      if (!isEmpty(basketItem)) {
        return Promise.resolve(basketItem);
      } else {
        return addItem(model, { awaitStates: null }).catch(() => {
          console.error("error adding pending item to basket", {
            product_id,
            model,
          });
          unsetItem(product_id);
          return Promise.reject("Error adding item to basket");
        });
      }
    } else {
      return Promise.reject("No product id found");
    }
  }

  function syncBasketItem(product_id: string, basketItem: ActorRef<any, any>) {
    if (!basketItem) return;
    const subscription: Subscription = basketItem.subscribe(
      (state: State<any, any>) => {
        if (state.matches("error")) {
          unsetItem(product_id);
          removeItem(basketItem.id);
        } else if (state.matches("available.configuring")) {
          setItem(product_id, state);
        }
      }
    );

    subscriptions.value ??= {}; // ensure we have a subscriptions object
    set(subscriptions.value, product_id, subscription);
  }

  function syncPendingBasketItems(): Promise<ActorRef<any, any>>[] {
    // get any products from the url query params and store them in our pending basket items
    const { productConfigs } = useQueryParams();
    products.value = map(productConfigs, "product_id");
    forEach(productConfigs, (product: IProductModel) => {
      // theres a chance we alrady have this product in our pending basket items
      // so we merge the existing product with the new product so we dont lose any data
      const existingProduct = get(pendingBasketItems.value, product.product_id);
      setItem(product.product_id, merge(existingProduct, product));
    });

    const promises = map(pendingBasketItems.value, (model, product_id) => {
      return ensureBasketItem(product_id, model).then(
        (basketItem: ActorRef<any, any>) => {
          setItem(product_id, basketItem?.getSnapshot()); // update our pending basket items with the new value
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
      const product_id = first(products.value);
      basketItem = find(itemsPending.value, [
        "state.context.model.product_id",
        product_id,
      ]);
    } else {
      basketItem = first(itemsPending.value) as ActorRef<any, any>;
    }
    if (!basketItem) return null;

    const pid = get(basketItem, "state.context.model.product_id");

    return {
      name: "productAdd",
      params: { pid },
    };
  }

  function getNextInvalidItem() {
    const basketItem = first(itemsInvalid.value) as ActorRef<any, any>;

    if (!basketItem) return null;

    return {
      name: "productEdit",
      params: { bpid: basketItem.id },
    };
  }

  function getNextRelatedItem(currentBasketItem: ActorRef<any, any>) {
    // Related items ar when the current items provision fields
    // contain the service identifier of another basket item

    const provision_fields = get(
      currentBasketItem,
      "state.context.model.provision_fields",
      {}
    );

    if (isEmpty(provision_fields)) return null;

    const basketItem = find(items.value, item => {
      const service_identifier = get(
        item,
        "state.context.lookups.product.service_identifier"
      );

      if (!service_identifier) return false;

      const value = includes(values(provision_fields), service_identifier);
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
    return (
      (includes(types, NextBasketItemTypes.RELATED) &&
        currentBasketItem &&
        getNextRelatedItem(currentBasketItem)) ||
      (includes(types, NextBasketItemTypes.PENDING) && getNextPendingItem()) ||
      (includes(types, NextBasketItemTypes.INVALID) && getNextInvalidItem()) ||
      null
    );
  }

  const hasNextBasketItem = computed(() => {
    return !isEmpty(pendingBasketItems.value) || !isEmpty(itemsInvalid.value);
  });

  const nextBasketItems = computed(() => {
    const pendingItems = map(
      itemsPending.value,
      "state.context.lookups.product"
    );
    const invalidItems = map(
      itemsInvalid.value,
      "state.context.lookups.product"
    );

    return [...pendingItems, ...invalidItems];
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
