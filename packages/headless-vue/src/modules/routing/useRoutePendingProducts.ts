// --- external
import { useRoute } from "vue-router";

// --- internal
import type { Route } from "@upmind-automation/headless";
import { useRoutingEngine } from "@upmind-automation/headless";
// import { useBasket } from "../basket";

// --- utils
import { computed } from "vue";
import { defaultsDeep } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export const useProductsPending = (route?: Route) => {
  const safeRoute = defaultsDeep(route || useRoute(), {
    name: undefined,
    path: undefined,
    query: undefined,
    params: undefined,
  });
  const { path, name, query, params } = safeRoute;

  const parsedRoute = {
    name: name?.toString(),
    path,
    query,
    params,
  };

  const { usePendingProducts } = useRoutingEngine();

  const {
    getBasketProduct,
    hasPendingProducts,
    getPendingProduct,
    setPendingProduct,
    unsetPendingProduct,
    syncPendingProducts,
  } = usePendingProducts(parsedRoute);

  // ---

  return {
    getBasketProduct,
    hasPendingProducts,
    getPendingProduct,
    setPendingProduct,
    unsetPendingProduct,
    syncPendingProducts,
  };
};

export const useProductsRequiringAction = () => {
  const { useRequiresAction } = useRoutingEngine();
  const {
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    getProducts,
  } = useRequiresAction();

  // ---

  return {
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    products: computed(() => getProducts()),
  };
};
