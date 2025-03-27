// --- external
import { computed, ref } from "vue";

// --- internal
import { useBasketProductsPending as useUpmindPendingProducts } from "@upmind-automation/headless";
import { useBasketProductPending } from "./useBasketProductPending";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
type PendingProduct = ReturnType<typeof useBasketProductPending>;

// -----------------------------------------------------------------------------

export const useBasketProductsPending = () => {
  const { getProducts, get, remove, resolve, sync, clear } =
    useUpmindPendingProducts();

  const products = ref(getProducts());

  return {
    meta: computed(() => ({
      hasProducts: !isEmpty(products),
    })),
    products: computed(() => products.value),
    configure: async (
      pid?: string,
      sync?: boolean
    ): Promise<PendingProduct> => {
      const instance = await get(pid, sync);
      if (isEmpty(instance)) return Promise.reject("Not found");
      return Promise.resolve(useBasketProductPending(instance));
    },
    refresh: () => {
      products.value = getProducts();
    },
    remove,
    resolve,
    sync,
    clear,
  };
};
