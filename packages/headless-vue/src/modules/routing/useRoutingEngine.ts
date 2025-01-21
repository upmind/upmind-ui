// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";
import { useRoute, useRouter } from "vue-router";

// --- internal
import { useRoutingEngine as useUpmindRoutingEngine } from "@upmind-automation/headless";

// --- utils

import { isEmpty } from "lodash-es";

// --- types
import type { Route } from "@upmind-automation/headless";
// --------------------------------------------------------
// a composable that provides a simple interface to the flows engine
//  with some state helpers

/**
 * @ignore
 */
export const useRoutingEngine = () => {
  const { service, exists, destroy, isReady, next, back, resolve } =
    useUpmindRoutingEngine();

  const { state } = useActor(service);

  const route = useRoute();
  const router = useRouter();

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
      isProcessing: ["calculating", "resolving"].some(state.value.matches),
      isUnavailable: ["unavailable"].some(state.value.matches),
      isAvailable: !["subscribing", "unavailable"].some(state.value.matches),
      // ---
      hasFlows: !isEmpty(state.value.context?.flows),
    })),
    // ---
    exists,
    next: (data?: any) =>
      next(
        {
          name: route.name?.toString(),
          params: route.params,
          query: route.query,
        },
        data
      ).then((response: Route | undefined) => {
        if (response) {
          router.push(response);
        }
      }),

    back: (data?: any) =>
      back(
        {
          name: route.name?.toString(),
          params: route.params,
          query: route.query,
        },
        data
      ).then((response: Route | undefined) => {
        if (response) {
          router.push(response);
        }
      }),
    resolve,
    destroy,
  };
};
