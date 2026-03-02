import { ROUTE } from ".";
import { getBidParams } from "./funnels/cart";
import {
  type FunnelContext,
  useBasket,
  useBasketProductsPending,
  useBrand,
  useQueryParams,
  useRoutingEngine,
  useRouteRequiresAction,
  useProductRecommendations,
  useRecommendations,
  useSession,
  useBasketFields,
  type AnyEventObject,
  type FunnelResponse,
  useBasketProducts,
  isDomainProduct,
  useBasketBilling
} from "@upmind-automation/client-vue";
import {
  BrandConfigKeys,
  CheckoutFlows,
  QUERY_PARAMS,
  SemanticTypes,
  UpmindModuleCodes
} from "@upmind-automation/types";
import { filter, first, reduce } from "lodash-es";
import type { RouteLocationGeneric } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Services to handle asynchronous operations and validations within states.
 * @param context
 * @returns  Promise<void>
 */
export default {
  guardCheckoutFlow: async (
    _context: FunnelContext
  ): Promise<FunnelResponse> => {
    const { getConfigValue } = useBrand();
    const checkoutFlow = getConfigValue(BrandConfigKeys.CHECKOUT_FLOW);
    const route =
      checkoutFlow === CheckoutFlows.ONE_PAGE ? ROUTE.CHECKOUT : ROUTE.BASKET;

    return {
      target: { name: route }
    };
  },

  guardCatalogue: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { hasStorefront } = useBrand();
    if (!hasStorefront.value) return Promise.reject();

    // TODO CHECK catalog enabled brand settings

    return {
      target: targetRoute
    };
  },

  guardDomains: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { hasModuleEnabled } = useBrand();
    if (!hasModuleEnabled(UpmindModuleCodes.WEB_HOSTING))
      return Promise.reject();

    return {
      target: targetRoute
    };
  },

  /**
   * 🎯 Process Domain Provisioning
   * This service handles the provisioning of domains associated with a product in the funnel.
   * It checks for the presence of a product ID and whether a product has been added to the basket.
   * If no product is found, it proceeds without further action.
   * If a product is found, it retrieves the corresponding basket item and its configuration.
   * It then sets the provisioning fields for the domain and attempts to update the configuration.
   * Upon successful update, it resolves the provisioning process; if an error occurs,
   * it redirects to the BASKET_PRODUCT_EDIT route for manual configuration.
   */
  processDomainsWithProduct: async (
    { currentRoute, targetRoute }: FunnelContext,
    { data }: AnyEventObject
  ): Promise<FunnelResponse> => {
    const { findProduct, configure, products } = useBasketProducts();

    const route = targetRoute ?? currentRoute;
    const { productId } = useQueryParams(route as RouteLocationGeneric);
    const basketItem = findProduct({ productId }); // NB this will be the last one added!

    const domains = filter(products.value, product => {
      return isDomainProduct({
        blueprintCode: product.productDetails.blueprintCode,
        serviceIdentifier: product.serviceIdentifier,
        provisionFields: product.configuration.provisionFields
      });
    });

    const domain = data?.event?.domain ?? first(domains)?.serviceIdentifier;

    /** #1: We HAVE a BasketItem and HAVE been provided with a domain to assign */
    if (basketItem && domain) {
      const configuration = await configure(basketItem.id);

      const { isReady, update, setProvisioningFields, model, raw, stop } =
        configuration;

      await isReady();

      // Loop through the raw provision fields and find any with semantic_type = 'domain_name'
      //  and set the value to the selected domain
      const provisionFields = reduce(
        raw.value.provisionFields,
        (acc, field) => {
          if (field.semantic_type === SemanticTypes.DOMAIN_NAMES) {
            acc[field.name] = domain;
          }
          return acc;
        },
        model.value?.provisionFields || {}
      );

      return setProvisioningFields(provisionFields)
        .then(update)
        .then(() => ({ target: undefined }) as FunnelResponse)
        .catch(() => {
          // go to the product edit so we can manually configure
          return Promise.reject({
            target: {
              name: ROUTE.BASKET_PRODUCT_EDIT,
              params: { bpid: basketItem!.id, ...getBidParams() }
              // query: { pfields: provisionFields } // TODO pass the updated provision fields so we can prefill
            }
          } as FunnelResponse);
        })
        .finally(stop);
    }

    /** #2: We HAVE a Basket Item BUT DONT HAVE a domain to assign */
    if (basketItem) {
      return Promise.reject({
        target: {
          name: ROUTE.BASKET_PRODUCT_EDIT,
          params: { bpid: basketItem.id, ...getBidParams() }
        }
      } as FunnelResponse);
    }

    /** #3: We DONT HAVE a Basket Item BUT DO HAVE a product configuration */
    if (productId) {
      return Promise.reject({
        target: {
          name: ROUTE.PRODUCT_CONFIGURE,
          params: { pid: productId, ...getBidParams() }
        }
      } as FunnelResponse);
    }

    /** #4: We DONT HAVE any configuration */
    return { target: undefined } as FunnelResponse;
  },

  guardProductConfigure: async ({
    currentRoute,
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { get: getPendingProduct, resolve } = useBasketProductsPending();
    const route = targetRoute ?? currentRoute;

    const { productId, consumeParam } = useQueryParams(
      route as RouteLocationGeneric
    );

    // The autoupdate/express(legacy) param indicates that we should try add the product to the basket straight away
    const autoupdate =
      (consumeParam("autoupdate", false) || consumeParam("express", false)) ==
      true;

    return getPendingProduct(productId, { sync: true, silent: autoupdate })
      .then(basketItem => {
        return basketItem.isReady().then(() => {
          if (!autoupdate) {
            return {
              target: {
                name: ROUTE.PRODUCT_CONFIGURE,
                params: { pid: productId, ...getBidParams() }
              }
            } as FunnelResponse;
          }
          return basketItem
            .update()
            .then(() => {
              resolve(basketItem.service);
              return {
                type: "NEXT",
                target: {
                  params: { pid: productId, ...getBidParams() }
                }
              } as FunnelResponse;
            })
            .catch(() => {
              return {
                target: {
                  name: ROUTE.PRODUCT_CONFIGURE,
                  params: { pid: productId, ...getBidParams() }
                }
              } as FunnelResponse;
            });
        });
      })
      .catch((error: Error) => {
        return Promise.reject({
          target: {
            name: ROUTE.PRODUCT_NOT_FOUND,
            params: { pid: productId, ...getBidParams() }
          }
        } as FunnelResponse);
      });
  },

  guardProductEdit: async ({
    currentRoute,
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { getProduct } = useBasket();
    const route = targetRoute ?? currentRoute;

    const { basketProductId } = useQueryParams(route as RouteLocationGeneric);
    return getProduct(basketProductId).then(() => ({
      target: {
        name: ROUTE.BASKET_PRODUCT_EDIT,
        params: { bpid: basketProductId, ...getBidParams() }
      }
    }));
  },

  guardProductRequiresAction: async (
    { currentRoute, targetRoute }: FunnelContext,
    { data }: AnyEventObject
  ): Promise<FunnelResponse> => {
    const { isReady } = useBasket();

    return isReady().then(async () => {
      const { hasProducts, getNextRelated, getNextInvalid } =
        useRouteRequiresAction();

      const { getProduct } = useBasket();

      if (!hasProducts()) return Promise.reject();

      const route = targetRoute ?? currentRoute;
      let { basketProductId } =
        useQueryParams(route as RouteLocationGeneric) ?? data?.id;
      const basketProduct =
        data ?? (await getProduct(basketProductId).catch(() => undefined));

      // If we have a basketProduct Id, try fetch any related product that needs action
      const relatedBasketProduct = basketProduct
        ? getNextRelated(basketProduct)
        : undefined;
      const nextInvalidProduct = getNextInvalid();

      // if we have a related product that needs action, navigate to edit that product
      if (relatedBasketProduct) {
        return {
          target: {
            name: ROUTE.BASKET_PRODUCT_EDIT,
            params: { bpid: relatedBasketProduct?.id, ...getBidParams() }
          }
        };
      }

      return {
        target: {
          name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION,
          params: { bpid: nextInvalidProduct!.id, ...getBidParams() }
        }
      };
    });
  },

  guardProductRecommendations: async ({
    currentRoute,
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const route = targetRoute ?? currentRoute;
    const { productId } = useQueryParams(route as RouteLocationGeneric);
    if (!productId) return Promise.reject();

    const { meta, isReady } = useProductRecommendations(productId);
    return isReady().then(() => {
      return meta.value.hasUnseenRecommendations
        ? {
            target: targetRoute ?? {
              name: ROUTE.PRODUCT_RECOMMENDATIONS,
              params: { pid: productId, ...getBidParams() }
            }
          }
        : Promise.reject();
    });
  },

  guardRecommendations: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { meta, isReady } = useRecommendations();
    return isReady().then(() => {
      return meta.value.hasUnseenRecommendations
        ? {
            target: targetRoute ?? {
              name: ROUTE.RECOMMENDATIONS,
              params: getBidParams()
            }
          }
        : Promise.reject();
    });
  },

  guardSession: async ({
    currentRoute,
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { isAuthenticated } = useSession();
    const { router } = useRoutingEngine();

    // NB for session guard, we want to REJECT if authenticated, so that we can redirect away from auth pages
    return isAuthenticated()
      .then(() => {
        // Check for a returnUrl query param to redirect back to after auth
        const route = targetRoute ?? currentRoute;
        const returnUrlRaw = route?.query?.returnUrl?.toString();

        if (returnUrlRaw) {
          const resolvedRoute = router.resolve(returnUrlRaw);
          return {
            target: resolvedRoute.name
              ? {
                  name: resolvedRoute.name,
                  params: resolvedRoute.params,
                  query: resolvedRoute.query
                }
              : { path: resolvedRoute.path || returnUrlRaw }
          } as FunnelResponse;
        }

        return { target: targetRoute };
      })
      .catch(() => {
        return Promise.reject();
      });
  },

  /**
   * 🎯 Guard: BASKET
   * Validates access to the basket. Handles two flows:
   *
   * **With bid (basket ID in route):**
   * 1. Gate on authentication — reject with SESSION if not logged in.
   * 2. Set target basket ID so the machine loads `orders/{bid}`.
   * 3. If the bid is invalid/expired, fall through to current basket.
   *
   * **Without bid (current basket):**
   * 1. Wait for basket to be ready.
   * 2. Reject if basket has no products (→ BASKET_EMPTY).
   */
  guardBasket: async ({
    currentRoute,
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { meta, isReady, setTargetBasket, targetBasketId } = useBasket();
    const { isAuthenticated } = useSession();
    const route = targetRoute ?? currentRoute;
    const { getParam } = useQueryParams(route as RouteLocationGeneric);

    const basketId = getParam("bid") ?? getParam(QUERY_PARAMS.BASKET_ID);

    // When accessing a specific basket by ID, gate on authentication
    if (basketId) {
      const authenticated = await isAuthenticated().catch(() => false);
      if (!authenticated) {
        return Promise.reject({
          target: {
            name: ROUTE.SESSION,
            params: { bid: basketId },
            query: { returnUrl: `/order/basket/${basketId}` }
          }
        } as FunnelResponse);
      }

      // Set target BEFORE waiting — single load, no actors to cancel.
      if (targetBasketId.value !== basketId) {
        setTargetBasket(basketId);
      }
      await isReady();

      // If the basket loaded successfully with the target ID, resolve
      if (targetBasketId.value) {
        return {
          target: targetRoute ?? {
            name: ROUTE.BASKET,
            params: { bid: basketId }
          }
        };
      }

      // Otherwise the machine cleared targetBasketId (invalid/expired basket).
      // Fall through to the standard basket check below.
    }

    // Standard basket guard — check current basket has products
    await isReady();
    if (!meta.value.hasProducts) return Promise.reject();
    return { target: targetRoute ?? { name: ROUTE.BASKET } };
  },

  guardCheckout: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { meta, isReady } = useBasket();
    const { isReady: isFieldsReady, meta: fieldsMeta } = useBasketFields();
    const { isReady: isBillingReady } = useBasketBilling();
    const { getConfigValue } = useBrand();

    // first wait for the basket to be ready
    await isReady();

    // We always need to be authenticated to proceed to checkout
    if (meta.value.needsAuth) {
      return Promise.reject({
        target: { name: ROUTE.SESSION, params: getBidParams() }
      });
    }

    // We always need products in the basket to proceed to checkout
    if (!meta.value.hasProducts) {
      return Promise.reject({
        target: { name: ROUTE.BASKET, params: getBidParams() }
      });
    }

    // NB: In Stepped flow, we need to ALSO validate products and fields, so we ensure everything is valid before proceeding to checkout
    if (
      getConfigValue(BrandConfigKeys.CHECKOUT_FLOW) === CheckoutFlows.STEPPED
    ) {
      if (meta.value.hasInvalidProducts) {
        return Promise.reject({
          target: {
            name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION,
            params: getBidParams()
          }
        });
      }

      await isFieldsReady();
      const validFields = fieldsMeta.value.isComplete;
      if (!validFields) {
        return Promise.reject({
          target: { name: ROUTE.BASKET, params: getBidParams() }
        });
      }
    }

    // if we are definitely going to checkout, ensure billing is ready!
    // await Promise.allSettled([
    //   isBillingReady(),
    //   useClientAddresses().isReady(),
    //   useClientCompanies().isReady()
    // ]);
    return {
      target: targetRoute ?? { name: ROUTE.CHECKOUT, params: getBidParams() }
    };
  }
};
