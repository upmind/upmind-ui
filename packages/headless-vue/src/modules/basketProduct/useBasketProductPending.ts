// --- external

// --- internal
import { useBasketProductPending as useUpmindBasketProductPending } from "@upmind-automation/headless";
import { useProductConfig } from "../product";

// --- utils
import { has } from "lodash-es";

// --- types
import type { ProductModel } from "@upmind-automation/headless";
import { ActorRef } from "xstate";
type PendingProduct = ReturnType<typeof useUpmindBasketProductPending>;
// -----------------------------------------------------------------------------

export const useBasketProductPending = (
  data: ProductModel | PendingProduct | ActorRef<any>
) => {
  // we need our basket

  // and then we can generate our product machine
  const { service, isReady, update, remove, stop } = has(data, "service")
    ? (data as PendingProduct)
    : useUpmindBasketProductPending(data as ProductModel | ActorRef<any>);

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
