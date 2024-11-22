// --- external

// --- internal
import {
  responseCodes,
  useBasket,
  useBasketProduct as useUpmindBasketProduct,
} from "@upmind-automation/headless";

import { useProductConfig } from "../product";

// --- utils
import { get } from "lodash-es";

// --- types

// --------------------------------------------------------
// a composable that provides a simple interface to the  basket machine and then spawns a  product configuration machine
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

export const useBasketProduct = (id: string) => {
  // we need our basket
  const { service: basket } = useBasket();
  const rawBasket = get(basket.getSnapshot(), "context.basket");

  if (!rawBasket) {
    const error = new Error("No Basket available");
    // @ts-ignore
    error.code = responseCodes.Not_Found;
    throw error;
  }

  // and then we can generate our product machine
  const { service, isReady, update, remove, stop } = useUpmindBasketProduct(
    id,
    rawBasket
  );

  // NB: watch for the basket to be refreshed, so we can refresh the product config
  // in case of any changes to currency, promotions etc
  basket.onTransition(state => {
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
