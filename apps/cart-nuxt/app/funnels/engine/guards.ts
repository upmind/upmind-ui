import { get, isEmpty } from "lodash-es";

import {
  type AnyEventObject,
  type FunnelContext,
  getDomainBasketProducts,
  UIContext,
  useBasket,
  useBasketBilling,
  useConfig,
  useProductSetup,
  useQueryParams,
  useSession
} from "@upmind-automation/client-vue";
import { QUERY_PARAMS } from "@upmind-automation/types";
import type { RouteLocationGeneric } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Guards to control transitions between states based on specific conditions.
 * @param context
 * @returns  boolean
 */
const guards = {
  /**
   * Returns true when the service response target matches the current route.
   * Used by SESSION states to detect when guardSession resolves back to the
   * same page (no returnUrl), so the funnel can fall through to its own default.
   */
  isSameRoute: ({ currentRoute }: FunnelContext, { data }: AnyEventObject) =>
    data?.target?.name === currentRoute?.name,
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
  hasLockedProducts: () => {
    const { meta } = useBasket();
    return meta.value?.hasLockedProducts;
  },
  hasInvalidProducts: () => {
    const { meta } = useProductSetup();
    return meta.value?.isAvailable;
  },
  hasFields: () => {
    const { meta } = useBasket();
    return meta.value?.hasFields;
  },
  /**
   * Returns true when standalone billing is enabled (billing is readonly on checkout).
   * Used by BASKET NEXT to route through the billing page, and by CHECKOUT onError
   * to redirect when billing needs input.
   */
  hasStandaloneBilling: () => {
    const { ui } = useConfig({ context: UIContext.CHECKOUT });
    const { data } = useConfig({ context: UIContext.BILLING_DETAILS });
    return !data.billingDetailsDisabled && ui.billingDetails.isReadonly;
  },
  /**
   * Returns true when the user is already authenticated.
   * Synchronous check — reads reactive session meta without awaiting.
   * Used as an `always` guard to skip auth pages instantly.
   */
  isAuthenticated: () => {
    const { meta } = useSession();
    return !!meta.value?.isAuthenticated;
  },

  /**
   * Returns true when targetRoute.query contains a returnUrl.
   * Used to conditionally resolve returnUrl after auth success.
   */
  hasReturnUrl: ({ targetRoute }: FunnelContext) =>
    !isEmpty(get(targetRoute, ["query", QUERY_PARAMS.RETURN_URL])),

  /**
   * Returns true when basket contains domain products.
   */
  hasDomainProducts: () => {
    const { products } = useBasket();
    return !isEmpty(getDomainBasketProducts(products.value));
  },

  /**
   * Returns true when a domain in the basket still needs its required
   * provision/registrant fields (including address) filled in. The registrant
   * address is collected during product setup — NOT the billing page — so this
   * keys off product-setup completeness, not `billingModel.addressId`. Once the
   * registrant details exist the domain no longer forces the billing page.
   */
  needsAddressForDomains: () => {
    const { model: billingModel } = useBasketBilling();
    const { meta } = useProductSetup();
    // Force billing only when the order has no billing address yet AND a domain
    // still needs its address provision fields. With an address already set, or
    // once the registrant details are complete, the domain no longer forces
    // billing — an incomplete domain then falls through to product setup.
    return (
      !billingModel.value?.addressId && meta.value.hasProductsRequiringAddress
    );
  },

  /**
   * Returns true when billing page is needed (standalone billing incomplete or domains need address).
   */
  needsAddress: () => {
    const { ui } = useConfig({ context: UIContext.CHECKOUT });
    const { data } = useConfig({ context: UIContext.BILLING_DETAILS });
    const { meta: billingMeta } = useBasketBilling();

    // Standalone billing page is enabled when billing is readonly on checkout and incomplete
    const needsBillingPage =
      !data.billingDetailsDisabled &&
      ui.billingDetails.isReadonly &&
      !billingMeta.value.isComplete;

    return needsBillingPage || guards.needsAddressForDomains();
  }
};

export default guards;
