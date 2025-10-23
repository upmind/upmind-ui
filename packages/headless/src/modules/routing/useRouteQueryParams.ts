// --- external
import { useRoute } from "vue-router";
import { useRouteQueryParams as useUpmindRouteQueryParams } from "./";

// --- utils
import { defaultsDeep } from "lodash-es";

// --- types
import type { Route } from "./";

// -----------------------------------------------------------------------------

/**
 * Composable function to manage query parameters from a specified or current route.
 *
 * The `useQueryParams` function retrieves the query parameters for a given route.
 * If no route is provided, the function will default to using the current route.
 * It ensures that the route object has safe defaults for its properties
 * including `name`, `path`, `query`, and `params`.
 */
export const useQueryParams = (route?: Route) => {
  const safeRoute = defaultsDeep(route || useRoute(), {
    name: undefined,
    path: undefined,
    query: undefined,
    params: undefined
  });

  return useUpmindRouteQueryParams(safeRoute);
};
