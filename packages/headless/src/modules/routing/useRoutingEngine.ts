// --- external
import { computed, effectScope, ref, watch } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useI18n } from "../system";
import routingEngine from "./routingEngine.machine";

// --- utils
import {
  contextMatches,
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  type ResponseError,
  stateMatches,
  stateValue,
  stopService,
  useChildActor,
  useContext
} from "../../utils";
import { awaitResolved } from "./utils";
import { forEach, isString } from "lodash-es";

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
/** Mutex — prevents overlapping navigate calls from queuing duplicate RESOLVE events. */
let navigating = ref(false);
/**
 * Leading-edge "page committed" signal — bumped by RouteView's `@vue:mounted`
 * with the route name that just mounted. Used by `isResolved(target)` to
 * distinguish "funnel state is resolved" (xstate) from "page has actually
 * rendered" (Vue lifecycle). Equivalent to nuxt's `page:finish` hook.
 */
const mountedRoute = ref<string | undefined>(undefined);
/** Lifecycle callbacks for routing events (mirrors Vue Router naming). */
const lifecycleCallbacks = {
  afterEnter: new Set<() => void>(),
  beforeEnter: new Set<() => void>(),
  beforeLeave: new Set<() => void>(),
  resolving: new Set<() => void>(),
  resolved: new Set<() => void>()
};
let resolvingInitialised = false;

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

  /**
   * Resolves once the funnel is resolved AND (if a target is given) the page
   * for that target has mounted. Combines the xstate resolution signal with
   * RouteView's `@vue:mounted` signal (equivalent to nuxt's `page:finish`).
   */
  async function isMounted(target: RouteLocation | string): Promise<boolean> {
    const targetName = isString(target) ? target : target?.name?.toString();

    return new Promise<boolean>(resolve => {
      // A *detached* effectScope isolates this watcher from the caller's
      // effectScope. Without `true`, the watcher inherits the active scope
      // from whatever component synchronously triggered the navigation —
      // and is disposed when that component unmounts (e.g. during the
      // page transition this watcher is meant to detect), causing it to
      // silently miss the mount notification.
      const scope = effectScope(true);
      scope.run(() => {
        watch(
          mountedRoute,
          route => {
            if (
              route === targetName &&
              contextValue<boolean>(funnel, "resolved")
            ) {
              scope.stop();
              resolve(true);
            }
          },
          { immediate: true }
        );
      });
    });
  }

  // await waitFor(
  //   funnel?.value?.service ?? service,
  //   state => {
  //     // Stale waitFor — a newer isMounted call has been made; bail out.
  //     if (latestTarget.value !== targetName) return true;

  //     const resolved = !!contextValue<boolean>(state, "resolved");
  //     console.log("isMounted", {
  //       resolved,
  //       targetName,
  //       mountedRoute: mountedRoute.value
  //     });

  //     return resolved && (!targetName || mountedRoute.value === targetName);
  //   },
  //   { timeout: Infinity }

  // Signal to the caller whether this is still the live nav (true) or a
  // superseded one (false). scrollBehavior can return false to skip scroll.
  // return latestTarget.value === targetName;
  // }

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
    isResolved: !!contextValue<boolean>(funnel.value?.state, "resolved"),
    isInitialRoute: initialRoute.value,
    hasTarget: !!contextValue(funnel.value?.state, "targetRoute")
  }));

  // --- context

  const funnel = useChildActor(state, "currentFunnel");

  const errors = useContext<RoutingEngineContext["error"]>(state, "error");

  // --- methods
  function register({
    defaultFunnel,
    funnels,
    overlays,
    watchers
  }: {
    defaultFunnel?: RoutingEngineContext["defaultFunnel"];
    funnels?: RoutingEngineContext["funnels"];
    overlays?: RoutingEngineContext["overlays"];
    watchers?: RoutingEngineContext["watchers"];
  }) {
    send({
      type: "REGISTER",
      data: { defaultFunnel, funnels, overlays, watchers }
    });
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
    if (navigating.value) return;
    navigating.value = true;
    forEach([...lifecycleCallbacks.beforeLeave], cb => cb());

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
        console.warn("UseRoutingEngine", "Navigate route failed", {
          route: router.currentRoute.value,
          data,
          error
        });
      })
      .finally(() => {
        navigating.value = false;
      });
  }

  async function navigateNext(event?: any) {
    if (navigating.value) return;
    navigating.value = true;
    forEach([...lifecycleCallbacks.beforeLeave], cb => cb());

    // Pre-lock (FE-2587)
    send({ type: "PRE_RESOLVE" });
    send({ type: "NEXT", data: { route: router.currentRoute.value, event } });

    return awaitResolved(funnel.value?.service)
      .then(updateRouter)
      .catch((error: any) => {
        console.warn("UseRoutingEngine", "Next route failed", {
          route: router.currentRoute.value,
          event,
          error
        });
      })
      .finally(() => {
        navigating.value = false;
      });
  }

  async function navigateBack(event?: any) {
    if (navigating.value) return;
    navigating.value = true;
    forEach([...lifecycleCallbacks.beforeLeave], cb => cb());

    // Pre-lock (FE-2587)
    send({ type: "PRE_RESOLVE" });
    send({ type: "BACK", data: { route: router.currentRoute.value, event } });

    return awaitResolved(funnel.value?.service)
      .then(updateRouter)
      .catch((error: any) => {
        console.warn("UseRoutingEngine", "Back route failed", {
          route: router.currentRoute.value,
          event,
          error
        });
      })
      .finally(() => {
        navigating.value = false;
      });
  }

  async function resolve(
    target: string | FunnelTarget,
    route: RouteLocation,
    event?: any
  ) {
    const targetName = typeof target === "string" ? target : target?.name;
    const currentTargetName = contextValue<string>(
      funnel.value?.state,
      "targetRoute.name"
    );
    const availableStateName = stateValue<string>(
      funnel.value?.state,
      "value.available"
    );
    const alreadyResolved =
      meta.value.isResolved &&
      currentTargetName === targetName &&
      availableStateName === targetName;

    if (!alreadyResolved && (!meta.value.hasTarget || meta.value.isResolved)) {
      send({ type: "RESOLVE", data: { target, route, event } });
    }

    // When the route is already resolved (same name, same funnel state),
    // return the incoming route directly. The stale targetRoute in context may have
    // outdated query params (e.g. old category) that would cause incorrect redirects.
    return alreadyResolved
      ? Promise.resolve(route)
      : awaitResolved(funnel.value?.service);
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

  async function updateRouter(route: RouteLocation) {
    if (!router || !route) return;
    if (route?.meta?.replace) {
      await router.replace(route);
    } else {
      await router.push(route);
    }
    await isMounted(router.currentRoute.value);
  }

  /** Notify the routing engine that a route's page component has mounted. */
  function mount(name?: string): void {
    mountedRoute.value = name;
    // First page paint completes the initial-load phase.
    initialRoute.value = false;
    forEach([...lifecycleCallbacks.afterEnter], cb => cb());
  }

  /** Register a callback to run after a route's page has mounted. Returns unsubscribe function. */
  function onAfterEnter(callback: () => void): () => void {
    lifecycleCallbacks.afterEnter.add(callback);
    return () => lifecycleCallbacks.afterEnter.delete(callback);
  }

  /** Register a callback to run when navigation starts. Returns unsubscribe function. */
  function onBeforeLeave(callback: () => void): () => void {
    lifecycleCallbacks.beforeLeave.add(callback);
    return () => lifecycleCallbacks.beforeLeave.delete(callback);
  }

  /** Register a callback to run when route starts resolving. Returns unsubscribe function. */
  function onResolving(callback: () => void): () => void {
    lifecycleCallbacks.resolving.add(callback);
    return () => lifecycleCallbacks.resolving.delete(callback);
  }

  /** Register a callback to run when route is resolved. Returns unsubscribe function. */
  function onResolved(callback: () => void): () => void {
    lifecycleCallbacks.resolved.add(callback);
    return () => lifecycleCallbacks.resolved.delete(callback);
  }

  // Watch isResolved and fire callbacks on state changes
  watch(
    () => meta.value.isResolved,
    (isResolved, wasResolved) => {
      if (!resolvingInitialised) {
        resolvingInitialised = true;
        return;
      }
      if (!isResolved && wasResolved) {
        forEach([...lifecycleCallbacks.resolving], cb => cb());
      } else if (isResolved && !wasResolved) {
        forEach([...lifecycleCallbacks.resolved], cb => cb());
      }
    },
    { immediate: true }
  );

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /** True while a programmatic navigation is in progress. */
    isNavigating: navigating,
    isReady,
    isResolved,
    isMounted,
    meta,

    // --- context
    router,
    errors,
    currentRoute: computed(() => router?.currentRoute.value),

    //  --- methods
    init: (instance: Router) => (router ??= instance),
    mount,
    onAfterEnter,
    onBeforeLeave,
    onResolved,
    onResolving,
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
