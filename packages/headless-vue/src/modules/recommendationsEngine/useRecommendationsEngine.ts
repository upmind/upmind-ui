// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useRecommendationsEngine as useUpmindRecommendationsEngine } from "@upmind-automation/headless";

// --- utils
import { map, isEmpty } from "lodash-es";

// --- types
// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

/**
 * @ignore
 */
export const useRecommendationsEngine = () => {
  const { service, add, remove, toggle, reset, syncBasket, destroy, isReady } =
    useUpmindRecommendationsEngine();

  const { state }: any = useActor(service);

  // --------------------------------------------------------

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    // ---
    recommendations: computed(() => state.value.context.recommendations),
    model: computed(() => map(state.value.context.model, "domain")),
    // ---
    errors: computed(() => state.value.context?.error),

    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["subscribing", "loading"].some(state.value.matches),

      isSyncing: ["processing"].some(state.value.matches),

      hasErrors: ["error"].some(state.value.matches),

      // ---
      showRecommendations: state.value.matches("available"),

      isValid:
        state.value?.matches("available") &&
        !isEmpty(state.value.context?.model),
    })),
    // ---
    isReady,
    add,
    remove,
    toggle,
    reset,
    syncBasket,
    destroy,
  };
};
