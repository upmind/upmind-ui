// ---
// --- external
import { computed, watch } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import {
  useRoutingEngine as useUpmindRoutingEngine,
  useDataLayer,
  utils,
} from "@upmind-automation/headless";
import { useBasket } from "../basket";
import { useSession } from "../session";

// --- utils
const { DetailedError, responseCodes } = utils;
import { isEmpty } from "lodash-es";

// --- types
import type { Router, RouteLocation } from "vue-router";
import type { Route } from "@upmind-automation/headless";
import { ROUTE } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

// a singletom for the router
let router: Router;

export const useRoutingEngine = () => {
  const { meta } = useBasket();
  const { meta: sessionMeta } = useSession();
  const {
    service,
    exists,
    stop,
    isReady,
    next: resolveNext,
    back: resolveBack,
    resolve,
  } = useUpmindRoutingEngine();

  const { state } = useActor(service);

  // -----------------------------------------------------------------------------

  async function guard(route: RouteLocation): Promise<Route | RouteLocation> {
    const available = await isReady()
      .then(() => true)
      .catch(() => false);

    if (!available) {
      return {
        name: ROUTE.ERROR,
        path: "/error",
      };
    }

    const routeName = route?.name as ROUTE;
    // --- Only try resolve if the routeName exists in our routing engine
    if (exists(routeName)) {
      const target = await resolve(routeName, {
        path: route.path,
        params: route.params,
        query: route.query,
      }).catch(() => {
        return route;
      });

      return target;
    }

    return route;
  }

  async function next(data?: any): Promise<void> {
    const route = router.currentRoute.value;

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
    const route = router.currentRoute.value;

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

    const route = router.currentRoute.value;

    if (!route?.name) {
      // console.debug("UseRouteingEngine", "No route name", route);
      return Promise.reject(new Error("No route name"));
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
  watch(
    [meta, sessionMeta],
    (
      [{ hasProducts, isProcessing }, { isAuthenticated }],
      [{ hasProducts: hadProducts }, { isAuthenticated: wasAuthenticated }]
    ) => {
      if (!isAuthenticated && wasAuthenticated) {
        navigate(ROUTE.SESSION_END);
      } else if (!hasProducts && hadProducts) {
        navigate(ROUTE.EMPTY);
      }
    }
  );

  // ---------------------------------------------------------------------------
  return {
    isReady: async (): Promise<boolean> =>
      isReady()
        .then(() => {
          return waitFor(
            service,
            state => !["subscribing", "loading"].some(state.matches),
            { timeout: Infinity }
          ).then(state => {
            if (state.matches("unavailable")) {
              return Promise.reject(new Error("Routing Engine is unavailable"));
            }
            return true;
          });
        })
        .catch(() => {
          throw new DetailedError(
            "Routing Engine is unavailable",
            responseCodes.Conflict
          );
        }),

    isResolved: async (route: ROUTE | string): Promise<boolean> =>
      waitFor(service, state => ["resolved"].some(state.matches), {
        timeout: 60_000,
      }).then(state => {
        if (state.context.currentRoute?.name !== route)
          throw new DetailedError(
            "Route is not available",
            responseCodes.Forbidden
          );

        return true;
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
    init: (provider: Router) => {
      router ??= provider;
    },
    guard,
    exists,
    next,
    resolveNext,
    back,
    resolveBack,
    refresh: () => {
      router.go(0); // = roload current route without cache
    },
    navigate,
    resolve,
    stop,
  };
};
