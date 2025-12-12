import { isEmpty } from "lodash-es";

import {
  type AnyEventObject,
  type FunnelContext,
  useBasket,
  useQueryParams
} from "@upmind-automation/client-vue";
import type { RouteLocationGeneric } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Guards to control transitions between states based on specific conditions.
 * @param context
 * @returns  boolean
 */
export default {
  hasPid: ({ targetRoute }: FunnelContext, { data }: AnyEventObject) => {
    const route = data?.target ?? targetRoute;
    const { productId } = useQueryParams(route as RouteLocationGeneric);
    return !isEmpty(productId);
  },
  hasBpid: ({ targetRoute }: FunnelContext, { data }: AnyEventObject) => {
    const route = data?.target ?? targetRoute;
    const { basketProductId } = useQueryParams(route as RouteLocationGeneric);
    return !isEmpty(basketProductId);
  },
  hasProductConfigs: ({ currentRoute }: FunnelContext) => {
    const { productConfigs } = useQueryParams(currentRoute);
    return !isEmpty(productConfigs);
  },
  needsAuth: () => {
    const { meta } = useBasket();
    return meta.value?.needsAuth;
  },
  isEmpty: () => {
    const { meta } = useBasket();
    return !meta.value?.hasProducts;
  },
  hasProducts: () => {
    const { meta } = useBasket();
    return meta.value?.hasProducts;
  },
  hasInvalidProducts: () => {
    const { meta } = useBasket();
    return meta.value?.hasInvalidProducts;
  },
  hasFields: () => {
    const { meta } = useBasket();
    return meta.value?.hasFields;
  }
};
