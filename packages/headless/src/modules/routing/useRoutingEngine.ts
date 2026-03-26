// --- external
import { computed, ref } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useI18n } from "../system";
import routingEngine from "./routingEngine.machine";

// --- utils
import {
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  type ResponseError,
  stateMatches,
  stopService,
  useChildActor,
  useContext
} from "../../utils";
import { awaitResolved } from "./utils";
export { useRouteRequiresAction } from "./utils";

// --- types
import type { RouteLocation, Router } from "vue-router";
import type { FunnelTarget, RoutingEngineContext } from "./types";

// -----------------------------------------------------------------------------

// create a global instance of the machine & router
// NB don't automatically start the machine as in order for the inspector to work,
// it needs to be started after the inspected service is created, so we only start it when we need it

const service = interpret(routingEngine, { devTools: true });
let router: Router;
let initialRoute = ref(true);
export { router };

// -----------------------------------------------------------------------------

/**
 * Composable function to provide a routing engine to handle route management, navigation, and state control within the application.
 *
 * This composable enables integration with internationalisation, session, and basket states, and allows for advanced
 * route resolution and flow management.
 */
export const useRoutingEngine = () => {
  const { t } = useI18n();

  // --- state

  if (service.status == InterpreterStatus.NotStarted) service.start();
  const { state, send } = useActor(service);

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => !stateMatches(state, ["subscribing"]) && !!router,
      { timeout: Infinity }
    )
      .then(() => router.isReady().then(() => true))
      .catch(error => {
        throw new DetailedError(
          t("error.routing_engine_not_available"),
          responseCodes.Service_Unavailable,
          ErrorOrigin.Headless,
          {
            state: state.value.value,
            errors: error ?? state.value.context?.error
          }
        );
      });
  }

  async function isResolved(): Promise<boolean> {
    if (!funnel.value?.service) return true;

    return waitFor(funnel.value.service, state => state?.context?.resolved, {
      timeout: Infinity
    })
      .then(() => true)
      .catch(() => false);
  }

  const meta = computed(() => ({
    isSubscribing: stateMatches(state, "subscribing"),
    isLoading: stateMatches(state, ["available.loading"]),
    isAvailable: stateMatches(state, [
      "available.loading",
      "availableguiding",
      "error"
    ]),
    isGuiding: stateMatches(state, "available.guiding"),
    hasErrors: stateMatches(state, ["error"]),
    hasFunnels: contextMatches(state, "funnels"),
    isResolved: !!funnel.value?.state?.value?.context?.resolved,
    isInitialRoute: initialRoute.value,
    hasTarget: !!funnel.value?.state?.value?.context?.targetRoute
  }));

  // --- context

  const funnel = useChildActor(state, "currentFunnel");

  const errors = useContext<RoutingEngineContext["error"]>(state, "error");

  // --- methods
  function register({
    defaultFunnel,
    funnels,
    watchers
  }: {
    defaultFunnel?: RoutingEngineContext["defaultFunnel"];
    funnels?: RoutingEngineContext["funnels"];
    watchers?: RoutingEngineContext["watchers"];
  }) {
    send({ type: "REGISTER", data: { defaultFunnel, funnels, watchers } });
  }

  async function guard(route: RouteLocation): Promise<RouteLocation> {
    const available = await isReady()
      .then(() => true)
      .catch(() => false);

    // Bail out if routing engine is not available or route has no name to resolve
    if (!available || !route?.name) {
      return route;
    }

    // Proceed to guard the route
    return resolve(
      {
        name: route.name?.toString(),
        params: route.params,
        query: route.query,
        hash: route.hash,
        meta: route.meta
      },
      route
    ).catch(() => route);
  }

  async function navigate(target: string | FunnelTarget, data?: any) {
    // Pre-lock: set resolved:false BEFORE sending RESOLVE to close the race
    // window between programmatic navigation and reactive watchers (FE-2587)
    send({ type: "PRE_RESOLVE" });

    send({
      type: "RESOLVE",
      data: { target, route: router?.currentRoute?.value, event: data }
    });

    return awaitResolved(funnel.value?.service)
      .then(updateRouter)
      .catch((error: any) => {
        console.warn("UseRouteingEngine", "Navigate route Failed", {
          route: router.currentRoute.value,
          data,
          error
        });
      });
  }

  async function navigateNext(event?: any) {
    // Pre-lock (FE-2587)
    send({ type: "PRE_RESOLVE" });

    send({ type: "NEXT", data: { route: router.currentRoute.value, event } });

    return awaitResolved(funnel.value?.service)
      .then(updateRouter)
      .catch((error: any) => {
        console.warn("UseRouteingEngine", "Next route Failed", {
          route: router.currentRoute.value,
          event,
          error
        });
      });
  }

  async function navigateBack(event?: any) {
    // Pre-lock (FE-2587)
    send({ type: "PRE_RESOLVE" });

    send({ type: "BACK", data: { route: router.currentRoute.value, event } });

    return awaitResolved(funnel.value?.service)
      .then(updateRouter)
      .catch((error: any) => {
        console.warn("UseRouteingEngine", "Back route Failed", {
          route: router.currentRoute.value,
          event,
          error
        });
      });
  }

  async function resolve(
    target: string | FunnelTarget,
    route: RouteLocation,
    event?: any
  ) {
    if (!meta.value.hasTarget || meta.value.isResolved) {
      send({ type: "RESOLVE", data: { target, route, event } });
    }

    return awaitResolved(funnel.value?.service).then(target => {
      // once we have resolved at least once, we are no longer on the initial route
      initialRoute.value = false;
      return target;
    });
  }

  async function switchFunnel(
    funnel: string,
    route: RouteLocation,
    event?: any
  ) {
    const safeRoute = route ?? router.currentRoute.value;
    send({ type: "SWITCH", data: { funnel, route: safeRoute, event } });
    return waitFor(service, state =>
      stateMatches(state, ["available.guiding", "available.idle"])
    ).catch((error: Error | ResponseError) => {
      // fail silently
      console.warn("UseRoutingEngine", "Switch funnel failed", {
        funnel,
        route,
        error
      });
    });
  }

  function stop() {
    stopService(service);
  }

  function updateRouter(route: RouteLocation) {
    if (!router || !route) return;
    if (route?.meta?.replace) {
      router.replace(route);
    } else {
      router.push(route);
    }
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    isReady,
    isResolved,
    meta,

    // --- context
    router,
    errors,

    //  --- methods
    init: (instance: Router) => (router ??= instance),
    register,
    switchFunnel,
    guard,
    refresh: () => router.go(0), // = reload current route without cache
    stop,
    // --- navigation
    navigate,
    navigateNext,
    navigateBack
  };
};

/**
 * The return type of useSession composable.
 */
export type UseRoutingEngine = ReturnType<typeof useRoutingEngine>;
