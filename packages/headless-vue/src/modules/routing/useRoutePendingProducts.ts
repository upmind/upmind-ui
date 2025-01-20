// --- external
import { useRoute } from "vue-router";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";
// import { useBasket } from "../basket";

// --- utils
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
import { computed } from "vue";

// --- types

// -----------------------------------------------------------------------------
export const useProductsPending = () => {
  const { path, name, query, params } = useRoute();
  const route = {
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
  } = usePendingProducts(route);

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
