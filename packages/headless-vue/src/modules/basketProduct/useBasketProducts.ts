// --- external
import { computed, ref } from "vue";

// --- internal
import { IBasket } from "@upmind-automation/types";
import {
  useBasketProduct as useUpmindBasketProduct,
  useBasketProducts as useUpmindBasketProducts,
} from "@upmind-automation/headless";

import { useBasket } from "../basket";
import { useBasketProduct } from "./useBasketProduct";

// --- utils
import { isEmpty, debounce, includes, remove as _remove } from "lodash-es";
import { DEBOUNCE_DELAY } from "../../utils";

// --- types
type BasketProduct = ReturnType<typeof useBasketProduct>;

// -----------------------------------------------------------------------------

export const useBasketProducts = () => {
  const { get, updateQuantity, incrementQuantity, decrementQuantity, remove } =
    useUpmindBasketProducts();

  const processing = ref<string[]>([]);

  const { meta, products, refresh } = useBasket();

  /**
   * Debounce action to prevent multiple calls with a processing state
   * @param action
   * @param delay
   * @returns
   * @example
   * const action = debounceAction(async (bpid: string) => {
   *  await remove(bpid);
   * });
   *  action("123");
   */
  function action<T extends (...args: any[]) => Promise<IBasket>>(
    action: T,
    delay = DEBOUNCE_DELAY
  ): (...args: Parameters<T>) => Promise<IBasket> {
    return debounce((...args: Parameters<T>) => {
      // Assume the first argument is bpid
      const bpid = args[0];
      if (processing.value.includes(bpid)) {
        return Promise.reject("Already processing");
      }
      processing.value.push(bpid);
      return action(...args).finally(() => {
        processing.value = _remove(processing.value, bpid);
      });
    }, delay) as (...args: Parameters<T>) => Promise<IBasket>;
  }

  // ----------------------------------------------------------------------------

  return {
    meta: computed(() => ({
      hasProducts: !isEmpty(products.value),
      isLoading: meta.value.isLoading,
      isProcessing: (bpid?: string) =>
        bpid ? includes(processing.value, bpid) : !isEmpty(processing.value),
    })),

    products,

    configure: async (bpid: string): Promise<BasketProduct> => {
      const basketProduct = await get(bpid);
      if (isEmpty(basketProduct)) return Promise.reject("Not found");
      return Promise.resolve(useBasketProduct(basketProduct.id));
    },

    refresh,
    updateQuantity: action((bpid: string, value: number) =>
      updateQuantity(bpid, value)
    ),
    incrementQuantity: action((bpid: string) => incrementQuantity(bpid)),
    decrementQuantity: action((bpid: string) => decrementQuantity(bpid)),
    remove: action((bpid: string) => remove(bpid)),
  };
};
