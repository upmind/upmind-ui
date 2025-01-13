// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useRoutingEngine as useUpmindRoutingEngine } from "@upmind-automation/headless";
// --- utils
import { isEmpty } from "lodash-es";
// --- types
// --------------------------------------------------------
// a composable that provides a simple interface to the flows engine
//  with some state helpers

/**
 * @ignore
 */
export const useRoutingEngine = () => {
  const { service, destroy, isReady, next, back, navigate } =
    useUpmindRoutingEngine();

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
    flows: computed(() => state.value.context.flows),
    currentFlow: computed(() => state.value.context.currentFlow),
    // ---
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["subscribing"].some(state.value.matches),
      isRefreshing: ["refreshing"].some(state.value.matches),
      isProcessing: ["calculating", "navigating"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      // ---
      hasFlows: !isEmpty(state.value.context?.flows),
    })),
    // ---
    next,
    back,
    navigate,
    destroy,
  };
};
