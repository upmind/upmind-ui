// --- external
import { ref, computed } from "vue";

// --- internal
import {
  responseCodes,
  useBasket,
  useBasketProductConfig as useUpmindBasketProductConfig,
  useBasketProduct as useUpmindBasketProduct,
  useBrand,
} from "@upmind-automation/headless";

import { useProductConfig } from "../product";

// --- utils
import { contextValue } from "../../utils";
import {
  get,
  add,
  subtract,
  omit,
  isEmpty,
  toNumber,
  some,
  debounce,
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { ActorRef, State } from "xstate";
// --------------------------------------------------------
// a composable that provides a simple interface to the  basket machine and then spawns a  product configuration machine
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

import type { ComputedRef } from "vue";
import { utils } from "@upmind-automation/headless";
const { DetailedError } = utils;

export const useBasketProduct = (
  id: string
): {
  id: string;
  meta: ComputedRef<{
    isLoading: boolean;
    isNew: boolean;
    isDirty: boolean;
    isTouched: boolean;
    isUnavailable: boolean;
    hasErrors: boolean;
    isProcessing: boolean;
    hasProvisioning: boolean;
    hasAttributes: boolean;
    hasOptions: boolean;
    hasTerms: boolean;
    hasTaxIncluded: boolean;
  }>;
  error: ComputedRef<any>;
  product: ComputedRef<any>;
  model: ComputedRef<any>;
  summary: ComputedRef<any>;
  updateQuantity: (value: number) => Promise<ActorRef<any>>;
  incrementQuantity: () => Promise<ActorRef<any>>;
  decrementQuantity: () => Promise<ActorRef<any>>;
  remove: () => Promise<void>;
  stop: () => void;
} => {
  // we need our basket
  const { checkIncludesTax } = useBrand();
  const { service: basket, refresh: refreshBasket } = useBasket();
  const rawBasket = get(basket.getSnapshot(), "context.basket");
  const processing = ref(false);

  if (!rawBasket) {
    throw new DetailedError("No IBasket available", responseCodes.Not_Found);
  }

  // and then we can generate our product machine
  const { refresh, update, remove, basketProduct } = useUpmindBasketProduct(
    id,
    rawBasket,
    contextValue(basket.getSnapshot(), "error.provisioningErrors")
  );

  // NB: watch for the basket to be refreshed, so we can refresh the product config
  // in case of any changes to currency, promotions etc
  basket.onTransition((basketProduct: State<any>) => {
    if (basketProduct.matches("refreshing.complete")) {
      refresh(basketProduct?.context?.basket as IBasket);
    }
  });

  // ---------------------------------------------------------------------------
  const parseQuantity = (quantity: number, product: any): number => {
    quantity = toNumber(quantity) || 1; // ensure we have a number;
    // Check the product data is available
    // Check the quantity is valid,
    //  - min Quantity matches the product min
    //  - max Quantity matches the product max
    //  - quantity is a multiple of the product step
    // ensure the quantity is at least the min, or 1

    if (quantity < Math.max(product?.min, 1)) {
      quantity = Math.max(product?.min, 1);
    }

    // ensure the quantity is at most the max (if set)
    if (product?.max && quantity > product?.max) {
      quantity = product?.max;
    }

    // ensure the quantity is a multiple of the step (if set)
    if (product?.step && quantity % product?.step !== 0) {
      quantity = Math.ceil(quantity / product.step) * product.step;
    }

    return quantity;
  };

  const updateQuantity: (value: number) => Promise<ActorRef<any>> = async (
    value: number
  ) => {
    // sanity check
    if (!basketProduct.product) return Promise.reject("Product not found");
    if (processing.value) return Promise.reject("Already processing");
    if (!basketProduct.product?.quantifiable)
      return Promise.reject("Product not quantifiable");

    processing.value = true;
    basketProduct.quantity = parseQuantity(value, basketProduct.product);
    return update(basketProduct).finally(() => {
      return refreshBasket().finally(() => (processing.value = false));
    });
  };

  async function incrementQuantity(): Promise<ActorRef<any>> {
    const qty = get(basketProduct, "quantity", 0);
    return updateQuantity(add(qty, basketProduct.product.step || 1));
  }

  async function decrementQuantity(): Promise<ActorRef<any>> {
    const qty = get(basketProduct, "quantity", 0);
    return updateQuantity(subtract(qty, basketProduct.product?.step || 1));
  }

  // --------------------------------------------------------

  //Finally return the basket product composable as well as our additional functions to update/remove
  return {
    id,
    // ---
    meta: computed(() => ({
      isLoading: false,
      isNew: false,
      isDirty: false,
      isTouched: false,
      isUnavailable: isEmpty(basketProduct),
      hasErrors:
        !isEmpty(basketProduct.error) ||
        some(basketProduct.summary?.details, "invalid"),

      isProcessing: processing.value,
      // ---
      hasProvisioning: !!basketProduct?.provisionFields,
      hasAttributes: !!basketProduct?.attributes,
      hasOptions: !!basketProduct?.options,
      hasTerms: !!basketProduct?.term,

      hasTaxIncluded: checkIncludesTax(),
    })),
    // ---
    error: computed(() => get(basketProduct, "error")),
    product: computed(() => get(basketProduct, "product")),
    model: computed(() => omit(basketProduct, ["product", "summary", "error"])),
    summary: computed(() => get(basketProduct, "summary")),
    // ---
    updateQuantity: debounce(updateQuantity, 350) as (
      value: number
    ) => Promise<ActorRef<any>>,
    incrementQuantity: debounce(
      incrementQuantity,
      350
    ) as unknown as () => Promise<ActorRef<any>>,
    decrementQuantity: debounce(
      decrementQuantity,
      350
    ) as unknown as () => Promise<ActorRef<any>>,
    // ---

    // update: async () => {
    //   if (!basketProduct.product) return Promise.reject("Product not found");
    //   if (processing.value) return Promise.reject("Already processing");
    //   processing.value = true;
    //   return update(basketProduct)
    //     .then(refreshBasket)
    //     .finally(() => (processing.value = false));
    // },
    remove: async (): Promise<void> => {
      if (!basketProduct.product) return Promise.reject("Product not found");
      if (processing.value) return Promise.reject("Already processing");
      processing.value = true;
      remove()
        .then(refreshBasket)
        .finally(() => (processing.value = false));
    },

    stop,
  };
};

export const useBasketProductConfig = (id: string) => {
  // we need our basket
  const { service: basket } = useBasket();
  const rawBasket = get(basket.getSnapshot(), "context.basket");

  if (!rawBasket) {
    throw new DetailedError("No IBasket available", responseCodes.Not_Found);
  }

  // and then we can generate our product machine
  const { service, isReady, update, remove, stop } =
    useUpmindBasketProductConfig(id, rawBasket);

  // NB: watch for the basket to be refreshed, so we can refresh the product config
  // in case of any changes to currency, promotions etc
  basket.onTransition((state: State<any>) => {
    if (state.matches("refreshing.complete")) {
      service.send("REFRESH", { basket: state.context.basket });
    }
  });

  // ---
  // Now we can use our existing product config composable

  const {
    state,
    // context,
    errors,
    meta,
    // ---
    lookups,
    product,
    productImage,
    terms,
    options,
    attributes,
    fields,
    // ---
    model,
    summary,
    // ---
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    // ---
    updateTerm,
    isSelectedTerm,
    // ---
    updateAttributes,
    isSelectedAttribute,
    setAttributes,
    // ---
    updateOptions,
    isSelectedOption,
    setOptions,
    updateOptionQuantity,
    incrementOption,
    decrementOption,
    // ---
    setProvisioningFields,
    updateProvisioning,
    getProvisioningField,
    // ---
    reset,
  } = useProductConfig(service);

  // --------------------------------------------------------

  //Finally return the basket product composable as well as our additional functions to update/remove
  return {
    id,
    // ---
    service,
    state,
    errors,
    meta,
    // ---
    lookups,
    product,
    productImage,
    terms,
    options,
    attributes,
    fields,
    // ---
    model,
    summary,
    // ---
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    // ---
    updateTerm,
    isSelectedTerm,
    // ---
    updateAttributes,
    isSelectedAttribute,
    setAttributes,
    // ---
    updateOptions,
    isSelectedOption,
    setOptions,
    updateOptionQuantity,
    incrementOption,
    decrementOption,
    // ---
    setProvisioningFields,
    updateProvisioning,
    getProvisioningField,
    // ---
    reset,
    // --- our extended functions
    isReady,
    update,
    remove,
    stop,
  };
};
