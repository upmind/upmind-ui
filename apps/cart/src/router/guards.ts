import {
  type AnyEventObject,
  type FunnelContext,
  QUERY_PARAMS,
  useBasket,
  useQueryParams
} from "@upmind-automation/client-vue";
import { isEmpty } from "lodash-es";
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
   * Used in the LOADING state to redirect `?bid=xyz` to the BASKET route with the bid as a path param.
   */
  hasBid: ({ currentRoute }: FunnelContext, _event: AnyEventObject) => {
    const route = currentRoute as RouteLocationGeneric;
    return (
      !isEmpty(route?.params?.bid) ||
      !isEmpty(route?.query?.[QUERY_PARAMS.BASKET_ID])
    );
  },
  /**
   * Returns true when the service response target matches the current route.
   * Used by SESSION states to detect when guardSession resolves back to the
   * same page (no returnUrl), so the funnel can fall through to its own default.
   */
  isSameRoute: ({ currentRoute }: FunnelContext, { data }: AnyEventObject) =>
    data?.target?.name === currentRoute?.name,

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
