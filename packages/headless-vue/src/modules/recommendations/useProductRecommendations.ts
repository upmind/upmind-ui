// ---
// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useRecommendationsEngine as useUpmindRecommendationsEngine } from "@upmind-automation/headless";

// --- utils
import { isEmpty, some } from "lodash-es";
import { useContext } from "../../utils";

// --- types
import type { BasketProduct, ProductModel } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

/**
 * This composable is used to manage the product recommendations
 * for a specific product. It uses the recommendations engine
 * to fetch and manage the recommendations.
 * NB: Only recommendations that originate from the specified product will be available.
 * This is useful for displaying recommendations on the product detail page, or after adding to the basket
 * @param pid - The product id to get recommendations for
 * @returns
 */
export const useProductRecommendations = (pid: ProductModel["productId"]) => {
  const {
    service,
    add,
    remove,
    seen,
    fetchRecommendation,
    filterByProduct,
    reset,
    cancel,
    stop,
    isReady,
  } = useUpmindRecommendationsEngine();

  const { state } = useActor(service);

  // ---------------------------------------------------------------------------
  return {
    isReady: async () => {
      return isReady().then(() =>
        waitFor(
          service,
          state => !["subscribing", "loading"].some(state.matches),
          { timeout: Infinity }
        )
      );
    },

    state: computed(() => state.value.value),
    // ---
    // TODO filter by pid
    recommendations: computed(() => {
      const filtered = filterByProduct(
        pid,
        state.value.context.recommendations
      );
      return filtered;
    }),

    // ---
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["subscribing"].some(state.value.matches),
      isRefreshing: ["refreshing"].some(state.value.matches),
      isProcessing: ["processing"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      // ---
      isConfiguring: ["configuring"].some(state.value.matches),
      hasRecommendations: some(
        filterByProduct(pid, state.value.context.recommendations),
        ({ meta }) => !meta?.added && !meta?.seen
      ),
      hasUnseenRecommendations: some(
        filterByProduct(pid, state.value.context.recommendations),
        ({ meta }) => !meta?.seen
      ),
    })),
    // ---
    add,
    remove,
    reset,
    cancel,
    stop,
    seen,
    fetchRecommendation,
    basketItem: useContext(state, "basketItem"),
  };
};
