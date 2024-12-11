// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useRecommendationsEngine as useUpmindRecommendationsEngine } from "@upmind-automation/headless";
// --- utils
import { isEmpty } from "lodash-es";
import { useContext } from "../../utils";
// --- types
// --------------------------------------------------------
// a composable that provides a simple interface to the recommendations engine
//  with some state helpers

/**
 * @ignore
 */
export const useRecommendationsEngine = () => {
  const { service, add, remove, reset, cancel, destroy, isReady } =
    useUpmindRecommendationsEngine();

  const { state } = useActor(service);

  // --------------------------------------------------------

  return {
    isReady: async () => {
      await isReady();

      return waitFor(
        service,
        state => !["subscribing", "loading"].some(state.matches),
        { timeout: Infinity }
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
      isLoading: ["subscribing", "loading"].some(state.value.matches),
      isProcessing: ["processing"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      // ---
      hasRecommendations: !isEmpty(state.value.context?.recommendations),
      isConfiguring: ["configuring"].some(state.value.matches),
    })),
    // ---
    add,
    remove,
    reset,
    cancel,
    destroy,
    basketItem: useContext(state, "basketItem"),
  };
};
