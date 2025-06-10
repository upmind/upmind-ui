// --- external
import { useRoute } from "vue-router";

// --- internal
import { useRouteRequiresAction } from "./";

// --- utils
import { computed } from "vue";

// --- types

// -----------------------------------------------------------------------------

export const useProductsRequiringAction = () => {
  const {
    isReady,
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    getProducts,
  } = useRouteRequiresAction();

  // ---

  return {
    isReady,
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    products: computed(() => getProducts()),
  };
};
