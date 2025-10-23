// --- external

// --- internal
import { useBasket } from "../../basket";
import { useBrand } from "../../brand";
import { useRoutingEngine } from "..";

// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";
import { useSession } from "../../session";
import { BrandConfigKeys, CheckoutFlows } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Returns the correct targets for the checkout flow.
 * This is determined by Brand Settings `CHECKOUT_FLOW`
 * If we are `Stepped`, then we go Basket > Auth > Checkout > Order
 * If we are `One-Page`, then we go directly to Checkout > Order
 * If we are not logged In, then fallback to Session Register before Checkout
 * If we have invalid products, then fallback to Basket
 */
export const getCheckoutFlowTargets = () => {
  const { getConfigValue } = useBrand();

  const flow = getConfigValue(BrandConfigKeys.CHECKOUT_FLOW);

  switch (flow) {
    case CheckoutFlows.ONE_PAGE:
      return [
        ROUTE.CHECKOUT,
        ROUTE.SESSION_REGISTER,
        ROUTE.BASKET,
        ROUTE.EMPTY
      ];
    case CheckoutFlows.STEPPED:
    default:
      return [ROUTE.BASKET, ROUTE.EMPTY];
  }
};

export const useCheckoutFlows = () => {
  const routing = useRoutingEngine();
  const { getConfigValue } = useBrand();
  const { meta: basketMeta, invoice, isReady } = useBasket();
  const { meta: sessionMeta } = useSession();

  let flows: Flow[] = [
    {
      name: ROUTE.CHECKOUT,
      guard: async (_route: Route) => {
        await isReady();
        const validProducts =
          basketMeta.value.hasProducts && !basketMeta.value.hasInvalidProducts;
        const validFields = basketMeta.value.hasFields;
        const validAuth = sessionMeta.value.isAuthenticated;

        // NB if we are in a One-Page flow, we skip the products and fields validation here
        if (
          getConfigValue(BrandConfigKeys.CHECKOUT_FLOW) ===
          CheckoutFlows.ONE_PAGE
        )
          return validAuth;

        return validProducts && validFields && validAuth;
      },
      resolve: async (_route: Route) => {
        return { name: ROUTE.CHECKOUT };
      },
      targets: {
        next: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => basketMeta.value.isComplete,
            resolve: async (_route: Route) => {
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice.value?.id },
                query: {
                  payment_success: basketMeta.value.hasPaid.toString()
                }
              } as Route;
            }
          }
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => basketMeta.value.isComplete,
            resolve: async (_route: Route) => {
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice.value?.id },
                query: { payment_success: basketMeta.value.hasPaid.toString() }
              } as Route;
            }
          },
          {
            name: ROUTE.EMPTY,
            guard: async (_route: Route) =>
              isReady().then(() => !basketMeta.value.hasProducts)
          },
          {
            name: ROUTE.BASKET,
            guard: async (_route: Route) => {
              const { getConfigValue } = useBrand();
              const flow = getConfigValue(BrandConfigKeys.CHECKOUT_FLOW);

              // NB: One page flow goes directly to checkout, so we don't fallback to basket for invalid products
              if (flow === CheckoutFlows.ONE_PAGE) return false;

              return await isReady().then(
                () => basketMeta.value.hasInvalidProducts
              );
            }
          },
          {
            name: ROUTE.SESSION_REGISTER,
            guard: async (_route: Route) => {
              const validAuth = sessionMeta.value.isAuthenticated;
              return !validAuth;
            }
          }
        ]
      }
    }
  ];

  return {
    getFlows: () => flows,
    register: (data?: Flow[]) => {
      flows = uniqBy([...(data ?? []), ...flows], "name");
      routing.register(flows);
    }
  };
};
