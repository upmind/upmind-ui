// --- external
import { useRoute } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- internal

// --- utils
import { defaultsDeep } from "lodash-es";

// --- types
import type { Route } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

import type { RouteQueryParams } from "@upmind-automation/headless";

export const useQueryParams = (route?: Route): RouteQueryParams => {
  const safeRoute = defaultsDeep(route || useRoute(), {
    name: undefined,
    path: undefined,
    query: undefined,
    params: undefined,
  });

  return useRoutingEngine().useQueryParams(
    safeRoute
  ) as unknown as RouteQueryParams;
};
