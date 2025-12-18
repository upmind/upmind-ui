// --- external
import { computed } from "vue";

// --- internal
import { useRouteRequiresAction } from "./";

// -----------------------------------------------------------------------------

/**
 * Composable function to provide methods and properties related to products requiring action.
 *
 * This composable integrates functionality for identifying and managing products that require specific actions,
 * leveraging utilities from the `useRouteRequiresAction` hook. It facilitates the readiness state,
 * retrieval of the next actionable product in various conditions, and access to the list of products.
 */
export const useProductsRequiringAction = () => {
  const {
    isReady,
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    getProducts,
    meta
  } = useRouteRequiresAction();

  // ---

  return {
    isReady,
    meta,
    getNext,
    getNextPending,
    getNextInvalid,
    getNextRelated,
    products: computed(() => getProducts())
  };
};
