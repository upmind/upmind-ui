// --- external

// --- internal
import { useBasketProduct as useUpmindBasketProduct } from "@upmind-automation/headless";
import { useProductConfig } from "../product";

// --- utils

// --- types

// -----------------------------------------------------------------------------

export const useBasketProduct = (bpid: string) => {
  // we need our basket
  // and then we can generate our product machine
  const { service, isReady, update, remove, stop } =
    useUpmindBasketProduct(bpid);

  // ---
  //Finally return the  product config composable as well as our additional functions to update/remove
  return {
    service,
    ...useProductConfig(service),
    // ---
    isReady,
    update,
    remove,
    stop,
  };
};
