// --- external
import { computed, watch } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../basket";
import { useSession } from "../session";
import routingEngine from "./routingEngine.machine";

// --- utils
import {
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  stopService,
  useContext
} from "../../utils";
import { awaitResolved, useRouteQueryParams } from "./utils";
export { useRouteRequiresAction, useRouteQueryParams } from "./utils";
import { some } from "lodash-es";

// --- types
import type { InterpreterFrom } from "xstate";
import type { RouteLocation, Router } from "vue-router";
import { ROUTE } from "./types";
import type { Flow, Route, RoutingEngineContext } from "./types";
export type RouteQueryParams = typeof useRouteQueryParams;

// -----------------------------------------------------------------------------

// create a global instance of the machine & router
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(routingEngine, { devTools: false });
let router: Router;
// -----------------------------------------------------------------------------

export const useRoutingEngine = () => {
  const { meta: basketMeta } = useBasket();
  const { meta: sessionMeta } = useSession();

  // --- state

  if (service.status == InterpreterStatus.NotStarted) service.start();
  const { state, send } = useActor(service);

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => !stateMatches(state, ["subscribing", "loading"]) && !!router,
      { timeout: Infinity }
    )
      .then(state => {
        if (stateMatches(state, "unavailable"))
          throw "Routing Engine is unavailable";
      })
      .then(() => router.isReady().then(() => true))
      .catch(error => {
        throw new DetailedError(
          "Routing Engine is unavailable",
          responseCodes.Service_Unavailable,
          ErrorOrigin.Headless,
          {
            state: state.value.value,
            errors: error ?? state.value.context?.error
          }
        );
      });
  }

  async function isResolved(route: ROUTE | string): Promise<boolean> {
    return isReady().then(value => {
      if (!value) return false;

      const currentRoute = router?.currentRoute?.value;
      return resolve(route, {
        name: currentRoute?.name?.toString(),
        params: currentRoute.params,
        query: currentRoute.query
      })
        .then(() => true)
        .catch(() => false);
    });
  }

  const meta = computed(() => ({
    isLoading: stateMatches(state, "subscribing"),
    isProcessing: stateMatches(state, ["calculating", "resolving"]),
    isUnavailable: stateMatches(state, "unavailable"),
    isAvailable: !stateMatches(state, ["subscribing", "unavailable"]),
    // ---
    hasFlows: contextMatches(state, "flows")
  }));

  // --- context

  const flows = useContext<RoutingEngineContext["flows"]>(state, "flows", []);
  const currentFlow = useContext<RoutingEngineContext["currentFlow"]>(
    state,
    "currentFlow"
  );
  const currentRoute = useContext<RoutingEngineContext["currentRoute"]>(
    state,
    "currentRoute"
  );
  const errors = useContext<RoutingEngineContext["error"]>(state, "error");

  // --- helpers

  function exists(name: ROUTE) {
    return some(flows.value, flow => flow.name === name);
  }

  // --- methods

  async function guard(route: RouteLocation): Promise<Route | RouteLocation> {
    const available = await isReady()
      .then(() => true)
      .catch(() => false);

    if (!available) return route;

    const routeName = route?.name as ROUTE;
    // --- Only try resolve if the routeName exists in our routing engine
    if (exists(routeName)) {
      const target = await resolve(routeName, {
        path: route.path,
        params: route.params,
        query: route.query
      }).catch(() => {
        return route;
      });

      return target;
    }

    return route;
  }

  function register(flows: Flow[]) {
    send({ type: "REGISTER", data: flows });
  }

  function next(route: Route, event?: any) {
    send({ type: "NEXT", data: { route, event } });
    return awaitResolved(service);
  }

  function back(route: Route, event?: any) {
    send({ type: "BACK", data: { route, event } });
    return awaitResolved(service);
  }

  async function navigate(target: ROUTE | string, data?: any): Promise<void> {
    // bail out if we are already processing
    const isProcessing = ["calculating", "resolving"].some(state.value.matches);
    if (isProcessing) return;

    const route = router.currentRoute.value;

    if (!route?.name) {
      console.warn("UseRouteingEngine", "Could not Navigate route", {
        route,
        data
      }); // do nothing, just return
      return;
    }

    resolve(
      target as ROUTE,
      {
        name: route.name?.toString(),
        params: route.params,
        query: route.query
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
          error
        });
      });
  }

  async function navigateNext(event?: any) {
    const route = router.currentRoute.value;
    return next(
      {
        name: route?.name?.toString(),
        params: route.params,
        query: route.query
      },
      event
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
          event,
          error
        });
      });
  }

  async function navigateBack(event?: any) {
    const route = router.currentRoute.value;
    back(
      {
        name: route?.name?.toString(),
        params: route.params,
        query: route.query
      },
      event
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
          event,
          error
        });
      });
  }

  async function resolve(name: ROUTE | string, route: Route, event?: any) {
    send({ type: "RESOLVE", data: { name, route, event } });
    return awaitResolved(service);
  }

  function stop() {
    stopService(service as InterpreterFrom<any>);
  }

  // ---
  // set up automatic refresh when the user logs in or out or if the basket is emptied
  watch(
    [basketMeta, sessionMeta],
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
    // --- state
    isReady,
    isResolved,
    meta,

    // --- context
    router,
    flows,
    currentFlow,
    currentRoute,
    errors,

    //  --- methods
    init: (instance: Router) => {
      router ??= instance;
    },

    register,
    guard,
    exists,
    next,
    back,
    refresh: () => router.go(0), // = roload current route without cache
    resolve,
    stop,
    // --- navigation
    navigate,
    navigateNext,
    navigateBack
  };
};
