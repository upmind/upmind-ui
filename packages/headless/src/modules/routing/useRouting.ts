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
      return target;
    }

    return;
  }

  /**
   * Decorate all route records with brand specific UIschema or layout information
   * This modifies the route definitions (records) rather than the navigation location,
   * which avoids Vue Router warnings about mutating route.meta during navigation.
   */
  async function decorateRoutes() {
    const { uischema_Route, uiCart, isReady } = useBrand();
    await isReady();

    const fallbackTemplate = get(uiCart.value, "layout");

    // Loop through all registered routes and update their meta
    router.getRoutes().forEach(routeRecord => {
      const uischema = routeRecord.name
        ? (get(uischema_Route?.value, routeRecord.name, {}) as UIRouteOptions)
        : {};

      // Mutate the route RECORD's meta (this is allowed, unlike RouteLocation.meta)
      Object.assign(routeRecord.meta, {
        ...uischema,
        template: uischema?.template || fallbackTemplate
      });
    });
  }
  // ---------------------------------------------------------------------------

  /**
   * Initial route decoration and guarding on app load
   * NB: once the router is ready then need to force check the current route
   *     This is because on load the vue router resolves the route before the engine is ready
   */
  router.isReady().then(async () => {
    await decorateRoutes();
    const target = await guardRoute(router.currentRoute.value);
    if (target) {
      await router.push(target);
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
