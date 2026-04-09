// --- internal
import { useBrand, useDataLayer, useRoutingEngine } from "../";

// --- utils
import { get } from "lodash-es";

// --- types
import type { Router, RouteLocation } from "vue-router";
import { type UIRouteOptions } from "../brand/types";
import { decorateRoutes, ensureTrailingSlash, hasRouteChanged } from "./utils";
import { registerOverlayRoutes } from "./overlays";

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
    if (route?.query?.funnel) {
      await switchFunnel(route.query.funnel.toString(), route);
    }
    const target = await guard(route);

    // Only redirect if target exists and is meaningfully different from current route
    if (target && hasRouteChanged(route, target)) {
      return target;
    }

    return;
  }

  // ---------------------------------------------------------------------------

  /**
   * Initial route decoration and guarding on app load
   * NB: once the router is ready then need to force check the current route
   *     This is because on load the vue router resolves the route before the engine is ready
   */
  router.isReady().then(async () => {
    await decorateRoutes(router.getRoutes());
    // NB: Apps may also call registerOverlayRoutes() eagerly at router creation
    // for deep-link support. This call is idempotent and acts as a fallback.
    registerOverlayRoutes(router);
    const target = await guardRoute(router.currentRoute.value);
    if (target) {
      await router.replace(target);
    }
  });

  /**
   * Guard the route before each navigation with the routing engine
   * but only if the route name has changed
   */
  router.beforeEach(async to => guardRoute(to));

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
