// --- external
import { useRoute } from "vue-router";
import { useRouteQueryParams as useUpmindRouteQueryParams } from "./";

// --- internal

// --- utils
import { defaultsDeep, has } from "lodash-es";

// --- types
import type { Route } from "./";

// -----------------------------------------------------------------------------

export const useQueryParams = (route?: Route) => {
  const safeRoute = defaultsDeep(route || useRoute(), {
    name: undefined,
    path: undefined,
    query: undefined,
    hash: undefined,
    params: undefined
  });

  return useUpmindRouteQueryParams(safeRoute);
};
