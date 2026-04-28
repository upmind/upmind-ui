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
  useBasketBilling,
  useClientAddresses,
  useClientCompanies,
  useClientPhones,
  useConfig,
  UIContext,
  FunnelActions,
  type FunnelTarget
} from "@upmind-automation/client-vue";
import {
  BrandConfigKeys,
  CheckoutFlows,
  QUERY_PARAMS,
  SemanticTypes,
  UpmindModuleCodes
} from "@upmind-automation/types";
import { ROUTE } from ".";
import { filter, first, includes, reduce } from "lodash-es";
import type { RouteLocationGeneric } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Applies the client's default address, company and phone to the basket
 * billing details.  Returns a promise that resolves once the update settles
 * (or immediately if billing is already complete).
 *
 * Shared between the `setBillingDefaults` entry action (fire-and-forget) and
 * `guardBilling` (awaited) so the logic lives in a single place.
 */
export async function applyBillingDefaults(): Promise<void> {
  const {
    isReady: isBillingReady,
    meta: billingMeta,
    config: billingConfig,
    update
  } = useBasketBilling();

  // NB: isBillingReady() already gates on a valid auth session via the
  // billing machine's `subscribing` state (`hasClient` guard), so no
  // separate isAuthenticated() call is needed here.
  await isBillingReady();

  if (billingMeta.value.isComplete) return;

  const { default: defaultAddress, isReady: isAddressesReady } =
    useClientAddresses();
  const { default: defaultCompany, isReady: isCompaniesReady } =
    useClientCompanies();
  const { default: defaultPhone, isReady: isPhonesReady } = useClientPhones();

  await Promise.allSettled([
    isAddressesReady(),
    isCompaniesReady(),
    isPhonesReady()
  ]);

  const company = billingConfig.value?.requiresCompany && defaultCompany();

  await update({
    companyId: company?.id,
    addressId: company?.addressId ?? defaultAddress()?.id,
    phoneId: billingConfig.value?.requiresPhone && defaultPhone()?.id
  }).catch(() => {});
}

// -----------------------------------------------------------------------------

/**
 * Checks whether the current route carries a basket ID (bid).
 * When a bid is present and the user is NOT authenticated, rejects with a
 * SESSION redirect so the user can log in before accessing the basket.
 * Returns the detected bid (or undefined) so callers can act on it.
 */
async function ensureBidAuth(
  context: FunnelContext,
  returnRoute?: FunnelTarget
): Promise<string | undefined> {
  const { targetRoute, currentRoute } = context;
  const route = (targetRoute ?? currentRoute) as RouteLocationGeneric;
  const { getParam } = useQueryParams(route);
  const { meta } = useBasket();

  const basketId = getParam(QUERY_PARAMS.BASKET_ID);

  if (!basketId || meta.value.isUnavailable) return undefined;

  const { isAuthenticated } = useSession();
  const authenticated = await isAuthenticated().catch(() => false);

  if (!authenticated) {
    const { router } = useRoutingEngine();
    // Resolve the returnUrl from the caller's route definition (with bid merged),
    // falling back to the current route path or the basket route.
    const returnUrl = returnRoute
      ? router.resolve({
          ...returnRoute,
          params: { segment: "basket", bid: basketId, ...returnRoute.params }
        }).fullPath
      : route?.fullPath ||
        route?.path ||
        router.resolve({ name: ROUTE.BASKET, params: { bid: basketId } })
          .fullPath;

    return Promise.reject({
      target: {
        name: ROUTE.SESSION,
        params: { segment: "basket", bid: basketId },
        query: { returnUrl }
      }
    } as FunnelResponse);
  }

  return basketId;
}

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

  guardCatalogue: async (context: FunnelContext): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.CATALOGUE });

    const { hasStorefront } = useBrand();
    if (!hasStorefront.value) return Promise.reject();

    // TODO CHECK catalog enabled brand settings

    return {
      target: context.targetRoute
    };
  },

  guardDomains: async (context: FunnelContext): Promise<FunnelResponse> => {
    await ensureBidAuth(context, {
      name: ROUTE.DOMAINS,
      query: context.targetRoute?.query
    });

    const { hasModuleEnabled } = useBrand();
    if (!hasModuleEnabled(UpmindModuleCodes.WEB_HOSTING))
      return Promise.reject();

    return {
      target: context.targetRoute
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
              params: { bpid: basketItem!.id }
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
          params: { bpid: basketItem.id }
        }
      } as FunnelResponse);
    }

    /** #3: We DONT HAVE a Basket Item BUT DO HAVE a product configuration */
    if (productId) {
      return Promise.reject({
        target: {
          name: ROUTE.PRODUCT_CONFIGURE,
          params: { pid: productId }
        }
      } as FunnelResponse);
    }

    /** #4: We DONT HAVE any configuration */
    return { target: undefined } as FunnelResponse;
  },

  guardProductConfigure: async (
    context: FunnelContext
  ): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.PRODUCT_CONFIGURE });

    const { get: getPendingProduct } = useBasketProductsPending();
    const route = context.targetRoute ?? context.currentRoute;
    const { productId, consumeParam } = useQueryParams(
      route as RouteLocationGeneric
    );

    // The autoupdate/express(legacy) param indicates that we should try add the product to the basket straight away
    const autoupdate =
      (consumeParam("autoupdate", false) || consumeParam("express", false)) ==
      true;

    // Only sync (set processing flag + subscribe) on the autoupdate path —
    // the configure flow has no in-flight operation to track here, and a
    // user who abandons configuration would otherwise leak `processing[pid]`.
    return getPendingProduct(productId, {
      sync: autoupdate,
      silent: autoupdate
    })
      .then(basketItem => {
        return basketItem.isReady().then(() => {
          if (!autoupdate) {
            return {
              target: {
                name: ROUTE.PRODUCT_CONFIGURE,
                params: { pid: productId }
              }
            } as FunnelResponse;
          }
          return basketItem
            .update()
            .then(async () => {
              const returnUrl = consumeParam("returnUrl", false);
              if (returnUrl) {
                const { meta: recMeta, isReady: recsReady } =
                  useProductRecommendations(productId);
                await recsReady();
                if (!recMeta.value.hasUnseenRecommendations) {
                  const { router } = useRoutingEngine();
                  return {
                    target: router.resolve(returnUrl as string)
                  } as FunnelResponse;
                }
              }

              return {
                type: "NEXT",
                target: {
                  params: { pid: productId }
                }
              } as FunnelResponse;
            })
            .catch(() => {
              return {
                target: {
                  name: ROUTE.PRODUCT_CONFIGURE,
                  params: { pid: productId }
                }
              } as FunnelResponse;
            });
        });
      })
      .catch((_error: Error) => {
        return Promise.reject({
          target: {
            name: ROUTE.PRODUCT_NOT_FOUND,
            params: { pid: productId }
          }
        } as FunnelResponse);
      });
  },

  guardProductEdit: async (context: FunnelContext): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.BASKET_PRODUCT_EDIT });

    const { getProduct } = useBasket();
    const route = context.targetRoute ?? context.currentRoute;
    const { basketProductId } = useQueryParams(route as RouteLocationGeneric);
    return getProduct(basketProductId).then(() => ({
      target: {
        name: ROUTE.BASKET_PRODUCT_EDIT,
        params: { bpid: basketProductId }
      }
    }));
  },

  guardProductRequiresAction: async (
    context: FunnelContext,
    { data }: AnyEventObject
  ): Promise<FunnelResponse> => {
    await ensureBidAuth(context, {
      name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION
    });

    const { isReady } = useBasket();

    return isReady().then(async () => {
      const { hasProducts, getNextRelated, getNextInvalid } =
        useRouteRequiresAction();

      const { getProduct } = useBasket();

      if (!hasProducts()) return Promise.reject();

      const route = context.targetRoute ?? context.currentRoute;
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
            params: { bpid: relatedBasketProduct?.id }
          }
        };
      }

      return {
        target: {
          name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION,
          params: { bpid: nextInvalidProduct!.id }
        }
      };
    });
  },

  guardProductRecommendations: async (
    context: FunnelContext
  ): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.PRODUCT_RECOMMENDATIONS });

    const route = context.targetRoute ?? context.currentRoute;
    const { productId } = useQueryParams(route as RouteLocationGeneric);
    if (!productId) return Promise.reject();

    const { meta, isReady } = useProductRecommendations(productId);
    return isReady().then(() => {
      return meta.value.hasUnseenRecommendations
        ? {
            target: context.targetRoute ?? {
              name: ROUTE.PRODUCT_RECOMMENDATIONS,
              params: { pid: productId }
            }
          }
        : Promise.reject();
    });
  },

  guardRecommendations: async (
    context: FunnelContext
  ): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.RECOMMENDATIONS });

    const { meta, isReady } = useRecommendations();
    return isReady().then(() => {
      return meta.value.hasUnseenRecommendations
        ? {
            target: context.targetRoute ?? {
              name: ROUTE.RECOMMENDATIONS
            }
          }
        : Promise.reject();
    });
  },

  guardSession: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { router } = useRoutingEngine();

    // NB for session guard, we want to REJECT if authenticated, so that we can redirect away from auth pages
    // EXCEPT for the logout route, where we want to allow the user to proceed with logging out.
    if (targetRoute?.name === ROUTE.SESSION_END) {
      return {
        type: FunnelActions.NEXT
      };
    }

    const session = useSession();

    // Wait for session to be fully ready and authenticated if a transition is in progress
    await session.isReady();

    // Check if we are authenticated. We use the check method to ensure
    // we wait for the profile load to complete.
    if (
      session.meta.value.isAuthenticated ||
      (await session.isAuthenticated().catch(() => false))
    ) {
      // We are authenticated and profile is loaded
    } else {
      return Promise.reject();
    }

    const returnUrl = targetRoute?.query?.returnUrl?.toString();
    const resolved = returnUrl ? router.resolve(returnUrl) : undefined;
    const isSessionRoute = includes(
      [
        ROUTE.SESSION,
        ROUTE.SESSION_LOGIN,
        ROUTE.SESSION_REGISTER,
        ROUTE.SESSION_RECOVER_PASSWORD,
        ROUTE.SESSION_END,
        ROUTE.SESSION_TRANSFER
      ],
      resolved?.name
    );

    const resolvedRoute =
      resolved && !isSessionRoute ? (resolved as FunnelTarget) : targetRoute;

    return {
      type: FunnelActions.REDIRECT,
      target: resolvedRoute
    };
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
    const { meta: authMeta } = useSession();
    const { router } = useRoutingEngine();

    const { getParam } = useQueryParams(
      (targetRoute ?? currentRoute) as RouteLocationGeneric
    );
    let bid = getParam(QUERY_PARAMS.BASKET_ID);

    // When accessing a specific basket by ID, gate on authentication
    if (bid && !meta.value.isUnavailable) {
      if (!authMeta.value.isAuthenticated) {
        const route: RouteLocationGeneric =
          (targetRoute as RouteLocationGeneric) ??
          (currentRoute as RouteLocationGeneric) ??
          router.resolve({
            name: ROUTE.BASKET,
            params: { bid }
          });

        return Promise.reject({
          target: {
            name: ROUTE.SESSION,
            params: { segment: "basket", bid },
            query: { returnUrl: route.fullPath }
          }
        } as FunnelResponse);
      }

      // Set target BEFORE waiting — single load, no actors to cancel.
      if (targetBasketId.value !== bid) {
        await setTargetBasket(bid);
        if (meta.value.isUnavailable) {
          return {
            target: targetRoute ?? {
              name: ROUTE.BASKET
            }
          };
        }
      }
      await isReady();

      // If the basket loaded successfully with the target ID, resolve
      if (targetBasketId.value) {
        return {
          target: targetRoute ?? {
            name: ROUTE.BASKET,
            params: { bid }
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

  guardCheckout: async (context: FunnelContext): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.CHECKOUT });

    const { meta, isReady } = useBasket();
    const { isReady: isFieldsReady, meta: fieldsMeta } = useBasketFields();
    const { getConfigValue } = useBrand();

    // first wait for the basket to be ready
    await isReady();

    // We always need to be authenticated to proceed to checkout
    if (meta.value.needsAuth) {
      const { router } = useRoutingEngine();
      const { targetBasketId } = useBasket();
      const bid = targetBasketId.value;
      const returnUrl = router.resolve({
        name: ROUTE.CHECKOUT,
        params: bid ? { segment: "basket", bid } : {}
      }).fullPath;

      return Promise.reject({
        target: {
          name: ROUTE.SESSION,
          query: { returnUrl }
        }
      } as FunnelResponse);
    }

    // We always need products in the basket to proceed to checkout
    if (!meta.value.hasProducts) {
      return Promise.reject({ target: { name: ROUTE.BASKET } });
    }

    // NB: In Stepped flow, we need to ALSO validate products and fields, so we ensure everything is valid before proceeding to checkout
    if (
      getConfigValue(BrandConfigKeys.CHECKOUT_FLOW) === CheckoutFlows.STEPPED
    ) {
      if (meta.value.hasInvalidProducts) {
        return Promise.reject({
          target: { name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION }
        });
      }

      await isFieldsReady();
      const validFields = fieldsMeta.value.isComplete;
      if (!validFields) {
        return Promise.reject({ target: { name: ROUTE.BASKET } });
      }
    }

    // Redirect to standalone billing if it needs input and user can't edit inline.
    const { isReady: isBillingReady, meta: billingMeta } = useBasketBilling();
    await isBillingReady();

    if (!billingMeta.value.isComplete) {
      const { ui } = useConfig({ context: UIContext.CHECKOUT });
      const { data } = useConfig({ context: UIContext.BILLING_DETAILS });
      if (!data.billingDetailsDisabled && ui.billingDetails.isReadonly) {
        const { router } = useRoutingEngine();
        if (
          !includes(
            [ROUTE.BILLING, ROUTE.CHECKOUT],
            router.currentRoute.value?.name
          )
        ) {
          return Promise.reject({
            target: { name: ROUTE.BILLING }
          } as FunnelResponse);
        }
      }
    }

    return { target: context.targetRoute ?? { name: ROUTE.CHECKOUT } };
  },

  guardBilling: async (
    context: FunnelContext,
    event: AnyEventObject
  ): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.BILLING });
    // If standalone billing isn't enabled, skip to checkout
    const { ui } = useConfig({ context: UIContext.CHECKOUT });
    const { data } = useConfig({ context: UIContext.BILLING_DETAILS });
    if (data.billingDetailsDisabled || !ui.billingDetails.isReadonly) {
      return { target: context.targetRoute ?? { name: ROUTE.CHECKOUT } };
    }

    // Skip billing when not authenticated — billing requires a client_id
    // to load. Checkout handles the auth redirect.
    const { meta: authMeta } = useSession();
    if (!authMeta.value.isAuthenticated) {
      return { target: { name: ROUTE.SESSION } };
    }

    // Load billing and check if it still needs input
    const { isReady: isBillingReady, meta: billingMeta } = useBasketBilling();
    await isBillingReady();

    // If billing is not yet complete, try applying client defaults (address,
    // company, phone) before deciding whether to skip.  This must be awaited
    // here rather than relying on the fire-and-forget `setBillingDefaults`
    // entry action, which races with this guard.
    if (!billingMeta.value.isComplete) {
      await applyBillingDefaults().catch(() => {});
    }

    // Skip billing when input isn't needed, unless the user explicitly
    // navigated here (e.g. the "Change" button on BillingSummary sends a
    // RESOLVE event via navigate()).  Auto-redirects from guardCheckout
    // arrive as error events and should be skipped when billing is complete.
    if (billingMeta.value.isComplete && event.type !== "RESOLVE") {
      return { target: { name: ROUTE.CHECKOUT } };
    }
    // Show billing page
    return { target: context.targetRoute ?? { name: ROUTE.BILLING } };
  }
};
