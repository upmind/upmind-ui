// --- external
import { useRoute } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- internal

// --- utils

// --- types

// -----------------------------------------------------------------------------

export const useQueryParams = () => {
  const { useQueryParams } = useRoutingEngine();

  const { path, name, query, params } = useRoute();
  const {
    productConfigs,
    productId,
    products,
    basketProductId,
    currency,
    coupon,
  } = useQueryParams({ name: name?.toString(), path, query, params });

  return {
    productId,
    products,
    productConfigs,
    basketProductId,
    currency,
    coupon,
  };
};
