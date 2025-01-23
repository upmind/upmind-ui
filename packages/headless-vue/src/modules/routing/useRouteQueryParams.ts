// --- external
import { useRoute } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";

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

  const { useQueryParams } = useRoutingEngine();

  const {
    parse,
    getParam,
    getParams,
    productConfigs,
    productId,
    products,
    basketProductId,
    currency,
    coupon,
  } = useQueryParams(safeRoute);

  return {
    parse,
    getParam,
    getParams,
    productId,
    products,
    productConfigs,
    basketProductId,
    currency,
    coupon,
  };
};
