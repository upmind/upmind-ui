// --------------------------------------------------------

// --- external
import { computed, watch } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";
import { useRoute, useRouter } from "vue-router";

// --- internal
import { useRoutingEngine as useUpmindRoutingEngine } from "@upmind-automation/headless";
import { useBasket } from "../basket";
import { useSession } from "../session";

// --- utils

import { isEmpty } from "lodash-es";

// --- types
import type { Route } from "@upmind-automation/headless";
import { ROUTE } from "@upmind-automation/headless";
// --------------------------------------------------------
// a composable that provides a simple interface to the flows engine
//  with some state helpers

export const useRoutingEngine = () => {
  const { meta } = useBasket();
  const { meta: sessionMeta } = useSession();

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
        name: route?.name?.toString(),
        params: route.params,
        query: route.query,
      },
      data
    )
      .then((response: Route | undefined) => {
        if (response) {
          if (response?.meta?.replace) {
            router.replace(response);
          } else {
            router.push(response);
          }
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
          if (response?.meta?.replace) {
            router.replace(response);
          } else {
            router.push(response);
          }
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

    if (!route?.name) {
      console.debug("UseRouteingEngine", "No route name", route);
      return Promise.reject("No route name");
    }

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
          if (response?.meta?.replace) {
            router.replace(response);
          } else {
            router.push(response);
          }
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
  watch(meta, ({ hasProducts }, { hasProducts: hadProducts }) => {
    if (!hasProducts && hadProducts) {
      navigate(ROUTE.EMPTY);
    }
  });
  watch(
    sessionMeta,
    ({ isAuthenticated }, { isAuthenticated: wasAuthenticated }) => {
      if (!isAuthenticated && wasAuthenticated) {
        navigate(ROUTE.SESSION_END);
      }
    }
  );

  // --------------------------------------------------------

  return {
    isReady: async () =>
      isReady()
        .then(() => {
          return waitFor(
            service,
            state => !["subscribing", "loading"].some(state.matches),
            { timeout: Infinity }
          ).then(state => {
            if (state.matches("unavailable")) {
              return Promise.reject("Routing Engine is unavailable");
            }
            return state;
          });
        })
        .catch(() => {
          return Promise.reject("Routing Engine is not ready");
        }),

    state: computed(() => state.value.value),
    // ---
    flows: computed(() => state.value.context.flows),
    currentFlow: computed(() => state.value.context.currentFlow),
    currentRoute: computed(() => state.value.context.currentRoute),
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
    resolveNext,
    back,
    resolveBack,
    refresh: () => router.go(0), // = roload current route
    navigate,
    resolve,
    destroy,
  };
};
