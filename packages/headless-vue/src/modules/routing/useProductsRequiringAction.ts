// --- external
import { useRoute } from "vue-router";

// --- internal
import { useRouteRequiresAction, utils } from "@upmind-automation/headless";

// --- utils
import { computed } from "vue";
import { defaultsDeep } from "lodash-es";

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
