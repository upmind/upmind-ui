// --------------------------------------------------------

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
// --------------------------------------------------------
// a composable that provides a simple interface to the recommendations engine
//  with some state helpers

/**
 * @ignore
 */
export const useRecommendationsEngine = () => {
  const {
    service,
    add,
    remove,
    seen,
    fetchRecommendation,
    reset,
    cancel,
    destroy,
    isReady,
  } = useUpmindRecommendationsEngine();

  const { state } = useActor(service);

  // --------------------------------------------------------

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
    recommendations: computed(() => state.value.context.recommendations),
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
      hasRecommendations:
        !isEmpty(state.value.context?.recommendations) &&
        some(
          state.value.context?.recommendations,
          ({ meta }) => !meta?.added && !meta?.seen
        ),
      hasUnseenRecommendations: some(
        state.value.context?.recommendations,
        ({ meta }) => !meta?.seen
      ),
    })),
    // ---
    add,
    remove,
    reset,
    cancel,
    destroy,
    seen,
    fetchRecommendation,
    basketItem: useContext(state, "basketItem"),
  };
};
