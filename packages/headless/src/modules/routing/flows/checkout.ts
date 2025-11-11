// --- external

// --- internal
import { useBasket, useBasketFields } from "../../basket";
import { useBrand } from "../../brand";
import { useRoutingEngine } from "..";

// --- utils
import { isEmpty, uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";
import { useSession } from "../../session";
import {
  BrandConfigKeys,
  CheckoutFlows,
  IInvoice,
  QUERY_PARAMS
} from "@upmind-automation/types";

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

/**
 * Composable function to manage the checkout-related flows.
 * It provides mechanisms to define navigation rules, manage their states, and register them with the routing system.
 * Each flow specifies its name, guard logic for conditional transitions, and target routes for navigation.
 */
export const useCheckoutFlows = () => {
  const routing = useRoutingEngine();
  const { getConfigValue } = useBrand();
  const { meta: basketMeta, isReady, invoice } = useBasket();
  const { isReady: isFieldsReady, meta: fieldsMeta } = useBasketFields();
  const { meta: sessionMeta } = useSession();

  let flows: Flow[] = [
    {
      name: ROUTE.CHECKOUT,
      guard: async (_route: Route) => {
        await isReady();
        const validAuth = sessionMeta.value.isAuthenticated;

        // NB if we are in a One-Page flow,  as long as we have products in the basket and are authenticated, we can proceed to checkout
        if (
          getConfigValue(BrandConfigKeys.CHECKOUT_FLOW) ===
          CheckoutFlows.ONE_PAGE
        ) {
          return validAuth && basketMeta.value.hasProducts;
        }

        // NB: In Stepped flow, we need to ALSO validate products and fields, so we ensure everything is valid before proceeding to checkout
        await isFieldsReady();
        const validFields = fieldsMeta.value.isComplete;
        const validProducts =
          basketMeta.value.hasProducts && !basketMeta.value.hasInvalidProducts;
        return validProducts && validFields && validAuth;
      },
      resolve: async (_route: Route) => {
        return { name: ROUTE.CHECKOUT };
      },
      targets: {
        next: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => !isEmpty(invoice.value?.id),
            resolve: async (_route: Route) => {
              const route = {
                name: ROUTE.ORDER,
                params: {
                  [QUERY_PARAMS.ORDER_ID]: invoice.value!.id
                },
                query: {
                  [QUERY_PARAMS.PAYMENT_SUCCESS]:
                    basketMeta.value.hasPaid.toString()
                }
              } as Route;
              return route;
            }
          }
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => !isEmpty(invoice.value?.id),
            resolve: async (_route: Route) => {
              const route = {
                name: ROUTE.ORDER,
                params: {
                  [QUERY_PARAMS.ORDER_ID]: invoice.value!.id
                },
                [QUERY_PARAMS.PAYMENT_SUCCESS]:
                  basketMeta.value.hasPaid.toString()
              } as Route;
              return route;
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
          ROUTE.SESSION_REGISTER
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
