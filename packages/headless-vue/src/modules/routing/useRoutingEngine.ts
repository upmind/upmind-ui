// --------------------------------------------------------

// --- external
import { computed, watch } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";
import { useRoute, useRouter } from "vue-router";

// --- internal
import { useRoutingEngine as useUpmindRoutingEngine } from "@upmind-automation/headless";
import { useBasket } from "../basket";

// --- utils

import { isEmpty, get } from "lodash-es";

// --- types
import type { Route } from "@upmind-automation/headless";
import { ROUTE } from "@upmind-automation/headless";
// --------------------------------------------------------
// a composable that provides a simple interface to the flows engine
//  with some state helpers

/**
 * @ignore
 */
export const useRoutingEngine = () => {
  const { meta } = useBasket();

  const {
    service,
    exists,
    destroy,
    isReady,
    next: resolveNext,
    back: resolveBack,
    resolve,
  } = useUpmindRoutingEngine();

  const { state } = useActor(service);

  const route = useRoute();
  const router = useRouter();

  // -----------------------------------------------------------------------------

  async function next(data?: any): Promise<void> {
    return resolveNext(
      {
        name: route.name?.toString(),
        params: route.params,
        query: route.query,
      },
      data
    )
      .then((response: Route | undefined) => {
        if (response) {
          router.push(response);
        }
      })
      .catch((error: any) => {
        console.warn("UseRouteingEngine", "Next route Failed", {
          route,
          data,
          error,
        });
      });
  }

  async function back(data?: any): Promise<void> {
    resolveBack(
      {
        name: route.name?.toString(),
        params: route.params,
        query: route.query,
      },
      data
    )
      .then((response: Route | undefined) => {
        if (response) {
          router.push(response);
        }
      })
      .catch((error: any) => {
        console.warn("UseRouteingEngine", "Back route Failed", {
          route,
          data,
          error,
        });
      });
  }

  async function navigate(target: ROUTE, data?: any): Promise<void> {
    // bail out if we are already processing
    const isProcessing = ["calculating", "resolving"].some(state.value.matches);
    if (isProcessing) return;

    resolve(
      target,
      {
        name: route.name?.toString(),
        params: route.params,
        query: route.query,
      },
      data
    )
      .then((response: Route | undefined) => {
        if (response) {
          router.push(response);
        }
      })
      .catch((error: any) => {
        console.warn("UseRouteingEngine", "Navigate route Failed", {
          route,
          data,
          error,
        });
      });
  }

  async function refresh(data?: any) {
    const target = get(state.value, "context.currentFlow");

    // bail out if we are already processing
    const isProcessing = ["calculating", "resolving"].some(state.value.matches);
    if (isProcessing) return;

    //  safeguard against empty flows
    if (isEmpty(target)) return Promise.reject("No current flow");

    return resolve(
      target.name,
      {
        name: route.name?.toString(),
        params: route.params,
        query: route.query,
      },
      data
    )
      .then((response: Route | undefined) => {
        if (response) {
          router.push(response);
        }
      })
      .catch((error: any) => {
        console.warn("UseRouteingEngine", "Navigate route Failed", {
          route,
          data,
          error,
        });
      });
  }

  // ---
  // set up automatic refresh when the user logs in or out or if the basket is emptied
  watch(
    meta,
    (
      { hasProducts, needsAuth },
      { hasProducts: hadProducts, needsAuth: neededAuth }
    ) => {
      if (needsAuth && !neededAuth) {
        navigate(ROUTE.SESSION_END);
      } else if (!hasProducts && hadProducts) {
        navigate(ROUTE.EMPTY);
      }
    }
  );

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
    next,
    back,
    refresh,
    navigate,
    resolve,
    destroy,
  };
};
