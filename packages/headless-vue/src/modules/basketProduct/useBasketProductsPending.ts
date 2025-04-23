// --- external
import { computed, ref } from "vue";

// --- internal
import { useBasketProductsPending as useUpmindPendingProducts } from "@upmind-automation/headless";
import { useBasketProductPending } from "./useBasketProductPending";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { isActor } from "xstate/lib/Actor";
type PendingProduct = ReturnType<typeof useBasketProductPending>;

// -----------------------------------------------------------------------------

export const useBasketProductsPending = () => {
  const { getProducts, get, remove, resolve, addMany, clear } =
    useUpmindPendingProducts();

  const products = ref(getProducts());

  return {
    meta: computed(() => ({
      hasProducts: !isEmpty(products),
    })),

    products,

    configure: async (
      pid?: string | ActorRef<any>,
      sync?: boolean
    ): Promise<PendingProduct> => {
      const instance = isActor(pid)
        ? (pid as ActorRef<any>)
        : await get(pid as string, sync);

      if (isEmpty(instance)) return Promise.reject("Not found");

      return Promise.resolve(useBasketProductPending(instance));
    },

    refresh: () => {
      products.value = getProducts();
    },
    remove,
    resolve,
    addMany,
    clear,
  };
};
