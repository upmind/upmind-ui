// --- internal
import { useBrand, useDataLayer, useRoutingEngine } from "../";

// --- utils
import { get } from "lodash-es";

// --- types
import type { Router, RouteLocation } from "vue-router";
import { UIRouteOptions } from "../brand/types";
import { hasRouteChanged } from "./utils";

// -----------------------------------------------------------------------------

/**
 * Initialises routing within the application by integrating the routing engine with the provided Vue Router instance.
 * the function sets up route guarding and decoration to manage navigation flows and apply brand-specific UI schemas.
 * @param router  - The Vue Router instance to integrate with the routing engine.
 */
export const useRouting = (router: Router): void => {
  const { init, guard, switchFunnel } = useRoutingEngine();
  const { dataLayer } = useDataLayer();

  // Initialise our engine with the given router
  init(router);

  // --- methods

  /**
   * Guard the route, using the routing engine to determine if navigation should proceed
   * @param route
   */
  async function guardRoute(route: RouteLocation) {
    // console.debug("Guarding route:", route);
    if (route?.query?.funnel) {
      await switchFunnel(route.query.funnel.toString(), route);
    }
    const target = await guard(route);

    // Only redirect if target exists and is meaningfully different from current route
    if (target && hasRouteChanged(route, target)) {
      // console.log("Routing Guard - redirecting to target route", { target });
      return target;
    }

    // Otherwise, let the route proceed as normal
    // console.debug("Routing Guard - route allowed", { route });
    return;
  }

  /**
   * Decorate the route with brand specific UIschema or layout information
   * @param route
   */
  async function decorateRoute(route: RouteLocation) {
    // console.debug("Decorating route:", route);
    const { uischema_Route, uiCart, isReady } = useBrand();
    await isReady();

    const fallbackTemplate = get(uiCart.value, "layout");
    const uischema = route?.name
      ? (get(uischema_Route?.value, route.name, {}) as UIRouteOptions)
      : {};

    route.meta = {
      ...uischema,
      ...{ template: uischema?.template || fallbackTemplate }, //NB: for backwards compatibility
      ...route?.meta
    };
  }
  // ---------------------------------------------------------------------------

  /**
   * Initial route decoration and guarding on app load
   * NB: once the router is ready then need to force check the current route
   *     This is because on load the vue router resolves the route before the engine is ready
   */
  router.isReady().then(async () => {
    await decorateRoute(router.currentRoute.value);
    const target = await guardRoute(router.currentRoute.value);
    if (target) {
      // NB redecorate the target route if different
      if (target.name !== router.currentRoute.value?.name)
        await decorateRoute(target);
      router.push(target);
    }
  });

  /**
   * Guard the route before each navigation with the routing engine
   * but only if the route name has changed
   */
  router.beforeEach(async (to, from) =>
    hasRouteChanged(from, to) ? guardRoute(to) : undefined
  );

  /**
   * Decorate the route before it is resolved with brand specific UIschema or layout information
   */
  router.beforeResolve(async to => decorateRoute(to));

  /**
   * After each route navigation, push a page_view event to the data layer for analytics
   */
  router.afterEach((to, from) => {
    dataLayer({ event: "page_view" })
      .withPage({
        to,
        from
      })
      .push(false);
  });
};
