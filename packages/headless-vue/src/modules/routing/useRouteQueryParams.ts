// --- external
import { useRoute } from "vue-router";
import { useRouteQueryParams as useUpmindRouteQueryParams } from "@upmind-automation/headless";

// --- internal

// --- utils
import { defaultsDeep } from "lodash-es";

// --- types
import type { Route } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useQueryParams = (route?: Route) => {
  const safeRoute = defaultsDeep(route || useRoute(), {
    name: undefined,
    path: undefined,
    query: undefined,
    params: undefined,
  });

  return useUpmindRouteQueryParams(safeRoute);
};
