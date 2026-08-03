import {
  type FunnelContext,
  useBasket,
  useBasketProductsPending,
  useBrand,
  useQueryParams,
  useRoutingEngine,
  useProductSetup,
  useProductRecommendations,
  useRecommendations,
  useActiveSession,
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
  type FunnelTarget,
  type OverlayResponse
} from "@upmind-automation/client-vue";
import {
  BrandConfigKeys,
  CheckoutFlows,
  QUERY_PARAMS,
  SemanticTypes,
  UpmindModuleCodes
} from "@upmind-automation/types";
import { FUNNEL, ROUTE } from "../types";
import guards from "./guards";
import { filter, first, includes, reduce } from "lodash-es";
import type { RouteLocationGeneric } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Checks whether the current route carries a basket ID (bid).
 * When a bid is present and the user is NOT authenticated, rejects with a
 * SESSION redirect so the user can log in before accessing the basket.
 * Returns the detected bid (or undefined) so callers can act on it.
 */
async function ensureBidAuth(
  context: FunnelContext,
  returnUrl?: FunnelTarget
): Promise<string | undefined> {
  const { targetRoute, currentRoute } = context;
  const route = (targetRoute ?? currentRoute) as RouteLocationGeneric;
  const { getParam } = useQueryParams(route);
  const { meta } = useBasket();

  const basketId = getParam(QUERY_PARAMS.BASKET_ID);

  if (!basketId || meta.value.isUnavailable) return undefined;

  const { isAuthenticated } = useActiveSession().useActions();
  const authenticated = await isAuthenticated()
    .then(() => true)
    .catch(() => false);

  if (!authenticated) {
    const { router } = useRoutingEngine();
    // Resolve the returnUrl from the caller's route definition (with bid merged),
    // falling back to the current route path or the basket route.
    const resolvedReturnUrl = returnUrl
      ? router.resolve({
          ...returnUrl,
          params: { segment: "basket", bid: basketId, ...returnUrl.params }
        }).fullPath
      : route?.fullPath ||
        route?.path ||
        router.resolve({ name: ROUTE.BASKET, params: { bid: basketId } })
          .fullPath;

    return Promise.reject({
      target: {
        name: ROUTE.SESSION,
        params: { segment: "basket", bid: basketId },
        query: { [QUERY_PARAMS.RETURN_URL]: resolvedReturnUrl }
      }
    } as FunnelResponse);
  }

  return basketId;
}

// -----------------------------------------------------------------------------

/**
 * Resolves a bid-aware `returnUrl` to the given funnel route — includes the
 * basket segment + bid when a target basket is active, so post-auth/verify
 * redirects land back on the correct basket-scoped URL.
 */
function bidReturnUrl(name: ROUTE): string {
  const { router } = useRoutingEngine();
  const { targetBasketId } = useBasket();
  const bid = targetBasketId.value;
  return router.resolve({
    name,
    params: bid ? { segment: "basket", bid } : {}
  }).fullPath;
}

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

    if (checkoutFlow === CheckoutFlows.ONE_PAGE)
      return { funnel: FUNNEL.ONE_PAGE, target: { name: ROUTE.BASKET } };

    if (checkoutFlow === CheckoutFlows.STEPPED)
      return { funnel: FUNNEL.STEPPED, target: { name: ROUTE.BASKET } };

    // fallback....
    return { target: { name: ROUTE.CHECKOUT } };
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
    const hasAutoupdateParam =
      (consumeParam("autoupdate", false) || consumeParam("express", false)) ==
      true;

    // Only sync (set processing flag + subscribe) on the autoupdate path —
    // the configure flow has no in-flight operation to track here, and a
    // user who abandons configuration would otherwise leak `processing[pid]`.
    return getPendingProduct(productId, {
      sync: hasAutoupdateParam,
      silent: hasAutoupdateParam
    })
      .then(basketItem => {
        return basketItem.isReady().then(() => {
          const { data } = useConfig({
            context: UIContext.CONFIGURE,
            product: basketItem.product
          });
          const autoupdate = hasAutoupdateParam || !!data.productAutoUpdate;

          if (!autoupdate) {
            return {
              target: {
                name: ROUTE.PRODUCT_CONFIGURE,
                params: { pid: productId }
              }
            } as FunnelResponse;
          }
          return basketItem
            .silence()
            .then(() => basketItem.update())
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
    currentRoute,
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

    const session = useActiveSession();

    // Always await the profile load — do NOT short-circuit on
    // `meta.isAuthenticated`. That flag flips true as soon as we enter the
    // client context, but the client `/self` may still be loading, so a
    // downstream synchronous guard like `isGuestClient` (reads
    // `client.value?.isGuest`) would see an empty client on refresh and return
    // false. `isAuthenticated()` waits for the client actor to be available.
    const isAuthed = await session
      .useActions()
      .isAuthenticated()
      .then(() => true)
      .catch(() => false);

    if (!isAuthed) {
      return Promise.reject();
    }

    // Guest customers are authenticated but not yet fully registered. Unlike
    // full clients — who get redirected away from auth pages — a guest must be
    // allowed onto the register route so they can complete their registration.
    // Rejecting here lets the SESSION_REGISTER state resolve and render the
    // page (Register.vue shows <GuestRegistration auto-show /> when isGuestClient).
    if (
      session.useMeta().isGuestClient.value &&
      (currentRoute?.name === ROUTE.SESSION_REGISTER ||
        targetRoute?.name === ROUTE.SESSION_REGISTER)
    ) {
      return Promise.reject();
    }

    const returnUrl = targetRoute?.query?.[QUERY_PARAMS.RETURN_URL]?.toString();
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
   * 1. Wait for the basket to be ready and any refresh to finish.
   * 2. Reject if basket has no products (→ BASKET_EMPTY).
   */
  guardBasket: async ({
    currentRoute,
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const {
      meta: _meta,
      isRefreshed,
      setTargetBasket,
      targetBasketId
    } = useBasket();
    const { isAuthenticated } = useActiveSession().useActions();
    const { router } = useRoutingEngine();

    const route: RouteLocationGeneric =
      (targetRoute as RouteLocationGeneric) ??
      (currentRoute as RouteLocationGeneric) ??
      router.resolve({ name: ROUTE.BASKET, params: { bid: "" } });

    const { getParam } = useQueryParams(route);
    const basketId = getParam(QUERY_PARAMS.BASKET_ID);

    // When accessing a specific basket by ID, gate on authentication
    if (basketId) {
      const authenticated = await isAuthenticated().catch(() => false);
      if (!authenticated) {
        // Use the actual route path so post-login redirects back to the
        // original page — not just the basket.
        const returnUrl = route?.fullPath || route?.path;

        return Promise.reject({
          target: {
            name: ROUTE.SESSION,
            params: { segment: "basket", bid: basketId },
            query: { [QUERY_PARAMS.RETURN_URL]: returnUrl }
          }
        } as FunnelResponse);
      }

      // Set target BEFORE waiting — single load, no actors to cancel.
      if (targetBasketId.value !== basketId) {
        setTargetBasket(basketId);
      }
      // @deprecated — Removed to avoid blocking render behind the global loader.
      // Basket pages now rely on inline skeleton states for loading feedback.
      // await isReady();

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

    // isRefreshed(), not isReady(): isReady resolves mid-refresh, so a product
    // still being added reads as empty and the funnel ping-pongs with
    // BASKET_EMPTY. Resolves immediately when nothing is refreshing.
    await isRefreshed();
    if (!guards.hasProducts()) return Promise.reject();

    return { target: targetRoute ?? { name: ROUTE.BASKET } };
  },

  guardCheckout: async (context: FunnelContext): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.CHECKOUT });

    const { isRefreshed } = useBasket();
    const { isReady: isFieldsReady, meta: fieldsMeta } = useBasketFields();

    await isRefreshed();

    // -------------------------------------------------------------------------
    // Guard order: 1. Auth → 2. Billing → 3. Basket issues (products/fields)
    // -------------------------------------------------------------------------

    // --- 1. Auth: Must be authenticated to proceed
    if (guards.needsAuth()) {
      return Promise.reject({
        target: {
          name: ROUTE.SESSION,
          query: { [QUERY_PARAMS.RETURN_URL]: bidReturnUrl(ROUTE.CHECKOUT) }
        }
      } as FunnelResponse);
    }

    // Unverified clients must verify their email before checkout.
    const session = useActiveSession();
    await session.useActions().isReady();
    if (session.useMeta().isUnverified.value) {
      return Promise.reject({
        type: FunnelActions.OVERLAY,
        target: {
          name: ROUTE.CHECKOUT
        },
        overlay: ROUTE.OVERLAY_VERIFY_EMAIL
      } as OverlayResponse);
    }

    // Must have products (that are not locked) to proceed
    if (!guards.hasProducts() || guards.hasLockedProducts()) {
      return Promise.reject({ target: { name: ROUTE.BASKET } });
    }

    // --- 2. Billing: Redirect to standalone billing page when required
    const { isReady: isBillingReady } = useBasketBilling();
    await isBillingReady();

    if (guards.needsAddress()) {
      const { router } = useRoutingEngine();
      // Skip redirect if already on billing or checkout (avoid redirect loops)
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

    // --- 3. Basket issues: Validate products and fields
    if (guards.hasInvalidProducts()) {
      return Promise.reject({
        target: { name: ROUTE.BASKET_PRODUCTS_SETUP }
      });
    }

    // Fields: bounce only when this checkout page won't collect them itself.
    // The basket always renders them (locked visible), so it is the step to
    // fall back to — no flow comparison needed, any funnel can be served.
    const { ui: checkoutUi } = useConfig({ context: UIContext.CHECKOUT });
    await isFieldsReady();

    const needsFields = !fieldsMeta.value.isComplete;
    const collectFields = checkoutUi.basketFields.isVisible;

    if (needsFields && !collectFields) {
      return Promise.reject({ target: { name: ROUTE.BASKET } });
    }

    return { target: context.targetRoute ?? { name: ROUTE.CHECKOUT } };
  },

  guardBilling: async (context: FunnelContext): Promise<FunnelResponse> => {
    await ensureBidAuth(context, { name: ROUTE.BILLING });

    // NB ensure basket is loaded before billing — billing relies on basket products to determine
    await useBasket().isReady();
    // Billing requires a basket with products
    if (!guards.hasProducts()) {
      return Promise.reject({ target: { name: ROUTE.BASKET } });
    }

    // Skip billing when not authenticated — billing requires a client_id
    // to load. Checkout handles the auth redirect.
    const { isAuthenticated } = useActiveSession().useMeta();
    if (!isAuthenticated.value) {
      return {
        target: {
          name: ROUTE.SESSION,
          query: { [QUERY_PARAMS.RETURN_URL]: bidReturnUrl(ROUTE.BILLING) }
        }
      };
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

    const { data } = useConfig({ context: UIContext.BILLING_DETAILS });

    // Don't show billing page if standalone billing is disabled — unless
    // domains in the basket need an address (registrant details are required).
    if (data.billingDetailsDisabled && !guards.needsAddressForDomains()) {
      return Promise.reject();
    }

    return { target: context.targetRoute ?? { name: ROUTE.BILLING } };
  },

  /**
   * 🎯 Guard: VERIFY_EMAIL
   *
   * Gating only. Shows the code-entry form when the logged-in client is
   * unverified; otherwise rejects so the funnel redirects away. Link-based
   * verification is a session-agnostic concern owned by the session machine
   * (see `useVerifyEmail`) and is not handled here.
   */
  guardVerifyEmail: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const session = useActiveSession();
    await session.useActions().isAuthenticated();

    // Show the code form only for a logged-in unverified client; otherwise the
    // route is irrelevant — reject and let the funnel redirect away.
    if (session.useMeta().isUnverified.value) {
      return { target: targetRoute ?? { name: ROUTE.OVERLAY_VERIFY_EMAIL } };
    }

    return Promise.reject();
  },

  /**
   * 🎯 Guard: BASKET_PRODUCTS_SETUP
   * Validates that products requiring setup exist.
   * If all products are complete, rejects to redirect to checkout.
   * The page internally determines which product to configure.
   */
  guardProductSetup: async (
    context: FunnelContext
  ): Promise<FunnelResponse> => {
    await ensureBidAuth(context, {
      name: ROUTE.BASKET_PRODUCTS_SETUP
    });

    const { isReady, meta } = useProductSetup();
    await isReady();

    // If setup is complete or we dont have any, redirect to checkout
    if (!meta.value.isAvailable || meta.value.isComplete) {
      return Promise.reject({
        target: context.targetRoute ?? { name: ROUTE.CHECKOUT }
      });
    }

    return {
      target: context.targetRoute ?? {
        name: ROUTE.BASKET_PRODUCTS_SETUP
      }
    };
  }
};
