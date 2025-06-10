// --- internal
import {
  useDataLayer,
  useRoutingEngine,
  useRoutingFlows,
} from "@upmind-automation/headless";

// --- utils
import { isEqual, isNil } from "lodash-es";
// --- types
import type { Router, RouteLocation } from "vue-router";
import { ROUTE, type Route, type Flow } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
/**
 *
 * @param router - The Vue Router instance.
 * @param routes - The routes to register. ( globbed eager loaded routes )
 * @returns {Object} An object containing the registerRoutes function.
 * @property {Function} registerRoutes - Method to register the routes and modules.
 * @method registerRoutes - Method to register the routes and modules.
 * @description
 * This function is used to dynamically register the routes based off a globbed import
 * and register the route with the RoutingEngine.
 * the register function is how we bind a router's route to a defined route in the RoutingEngine.
 * This also allows for registering custom guards and middleware for the routes.
 * The routing engine can then resolve the route and return the target route when navigating.
 */

export const useRouting = (router: Router, flows?: Flow[]): void => {
  const { register } = useRoutingFlows();
  const { init, guard } = useRoutingEngine();
  const { dataLayer } = useDataLayer();

  // Initialise our engine and register Flows that add to or override the default flows
  init(router);
  register(flows);

  function shouldRedirect(
    target: Route | RouteLocation | undefined,
    route: RouteLocation
  ) {
    const value =
      (!isNil(target?.name) && !isEqual(target.name, route?.name)) ||
      (!isNil(target?.path) && !isEqual(target.path, route?.path)) ||
      (!isNil(target?.query) && !isEqual(target.query, route?.query));

    return value;
  }

  // NB: once the router is ready then need to force check the current route
  // This is beacudse on load the vue router resolves the route before the engine is ready
  router.isReady().then(async () => {
    const route = router.currentRoute.value;
    const target = await guard(route);

    //  NB: only redirect if we have a target and it's not the same as the current routeName
    if (shouldRedirect(target, route)) router.push(target);
  });

  // ---------------------------------------------------------------------------
  // --- Route guards

  router.beforeEach(async (to, from) => {
    const route = to;
    const target = await guard(route);
    //  only redirect if we have a target and it's not the same as the current routeName
    if (shouldRedirect(target, route)) {
      return target;
    }
  });

  // Route tracking
  router.afterEach((to, from) => {
    dataLayer({ event: "page_view" })
      .withPage({
        to,
        from,
      })
      .push(false);
  });
};
