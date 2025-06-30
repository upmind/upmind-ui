// --- external
import { computed } from "vue";

// --- internal
import { useRecommendations } from "./";

// --- utils
import { reduce, some } from "lodash-es";
import { contextMatches, contextValue, stateMatches } from "../../utils";

// --- types
import type { ProductModel } from "../product";
import { RecommendationsEngineContext } from "./types";
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
    state,
    context,
    errors,
    basketItem,
    recommendations,
    add,
    remove,
    seen,
    fetchRecommendation,
    reset,
    cancel,
    stop,
    isReady
  } = useRecommendations();

  const productRecommendations = computed(
    (): RecommendationsEngineContext["recommendations"] => {
      const related = contextValue(state, "raw.related", []);
      return reduce(
        recommendations.value,
        (
          result: RecommendationsEngineContext["recommendations"],
          recomendation
        ) => {
          if (some(related, { id: recomendation.id, product_id: pid })) {
            result.push(recomendation);
          }
          return result;
        },
        []
      );
    }
  );

  const meta = computed(() => ({
    hasErrors: stateMatches(state, ["error"]),
    hasRecommendations:
      contextMatches(state, "recommendations") &&
      some(
        productRecommendations.value,
        ({ meta }) => !meta?.added && !meta?.seen
      ),
    hasUnseenRecommendations: some(
      productRecommendations.value,
      ({ meta }) => !meta?.seen
    ),
    isConfiguring: stateMatches(state, ["configuring"]),
    isLoading: stateMatches(state, ["subscribing"]),
    isProcessing: stateMatches(state, ["processing"]),
    isRefreshing: stateMatches(state, ["refreshing"])
  }));

  // ---------------------------------------------------------------------------
  return {
    // --- state

    state, // rare export of state to allow for us eto be able to re-use this compsable in the useProductRecommendations
    /**
     * Waits for the recommendations engine to be ready (available, unavailable, or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the recommendations engine state.
     * @typedef {Object} RecommendationsMeta
     * @property {boolean} hasErrors - True if the engine is in an error state.
     * @property {boolean} hasRecommendations - True if there are recommendations.
     * @property {boolean} hasUnseenRecommendations - True if there are unseen recommendations.
     * @property {boolean} isConfiguring - True if the engine is configuring.
     * @property {boolean} isLoading - True if the engine is loading.
     * @property {boolean} isProcessing - True if the engine is processing.
     * @property {boolean} isRefreshing - True if the engine is refreshing.
     */
    meta,

    // --- context

    /**
     * The current context
     */
    context,

    /** The current basket item context. */
    basketItem,

    /** Any error returned by the engine. */
    errors,

    /** The recommendations list. */
    recommendations: productRecommendations,

    // --- methods

    /**
     * Adds a product to the recommendations engine.
     * @param {string} id - The id of the product to add.
     */
    add,

    /** Cancels the current recommendations process. */
    cancel,

    /** Fetches a recommendation by value. */
    fetchRecommendation,

    /** Removes a recommendation by value. */
    remove,

    /** Resets the recommendations engine. */
    reset,

    /** Marks recommendations as seen. */
    seen,

    /** Stops the recommendations engine  */
    stop
  };
};
