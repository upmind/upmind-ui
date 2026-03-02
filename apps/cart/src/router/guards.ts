import { isEmpty } from "lodash-es";

import {
  type AnyEventObject,
  type FunnelContext,
  useBasket,
  useQueryParams
} from "@upmind-automation/client-vue";
import { QUERY_PARAMS } from "@upmind-automation/types";
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
  hasBasketId: (
    { currentRoute, targetRoute }: FunnelContext,
    _event: AnyEventObject
  ) => {
    const route = (targetRoute ?? currentRoute) as RouteLocationGeneric;
    return !isEmpty(route?.params?.bid) || !isEmpty(route?.query?.bid);
  },
  /**
   * Returns true when the current route has a `bid` path param or query param.
   * Used in the LOADING state to redirect `?bid=xyz` to the BASKET_WITH_ID route.
   */
  hasBid: ({ currentRoute }: FunnelContext, _event: AnyEventObject) => {
    const route = currentRoute as RouteLocationGeneric;
    return (
      !isEmpty(route?.params?.bid) ||
      !isEmpty(route?.query?.[QUERY_PARAMS.BASKET_ID])
    );
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
