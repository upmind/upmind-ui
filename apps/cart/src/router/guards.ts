import {
  type AnyEventObject,
  type FunnelContext,
  getDomainBasketProducts,
  QUERY_PARAMS,
  UIContext,
  useBasket,
  useBasketBilling,
  useConfig,
  useProductSetup,
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
   * Returns true when the error target is BILLING.
   * Used by CHECKOUT onError to route to billing before product setup.
   */
  isBilling: (_context: FunnelContext, { data }: AnyEventObject) => {
    return data?.target?.name === "billing";
  },

  /**
   * Returns true when basket contains domain products.
   */
  hasDomainProducts: () => {
    const { products } = useBasket();
    return !isEmpty(getDomainBasketProducts(products.value));
  },

  /**
   * Returns true when billing page is needed (standalone billing incomplete or domains need address).
   */
  needsAddress: () => {
    const { ui } = useConfig({ context: UIContext.CHECKOUT });
    const { data } = useConfig({ context: UIContext.BILLING_DETAILS });
    const { products } = useBasket();
    const { meta: billingMeta, model: billingModel } = useBasketBilling();

    // Domains require an address for registrant details
    const hasDomains = !isEmpty(getDomainBasketProducts(products.value));
    const needsAddressForDomains = hasDomains && !billingModel.value?.addressId;

    // Standalone billing page is enabled when billing is readonly on checkout and incomplete
    const needsBillingPage =
      !data.billingDetailsDisabled &&
      ui.billingDetails.isReadonly &&
      !billingMeta.value.isComplete;

    return needsBillingPage || needsAddressForDomains;
  },

  /**
   * Returns true when all products requiring setup are complete.
   * Used by BASKET_PRODUCTS_SETUP to skip when already complete.
   */
  isProductSetupComplete: () => {
    const { meta } = useProductSetup();
    return meta.value?.isComplete;
  }
};
