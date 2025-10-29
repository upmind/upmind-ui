// --- external

// --- internal
import { useBasket } from "../../basket";
import { useBrand } from "../../brand";
import { useRoutingEngine } from "..";

// --- utils
import { uniqBy } from "lodash-es";
import { useRouteQueryParams } from "../utils";
import { useBasketProductsPending } from "../../basketProduct";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";
import { BrandConfigKeys, CheckoutFlows } from "@upmind-automation/types";
import { getCheckoutFlowTargets } from "./checkout";

// -----------------------------------------------------------------------------

/**
 * Composable function to manage the basket-related flows.
 * It provides mechanisms to define navigation rules (aka flows), manage their states, and register them with the routing system.
 * Each flow specifies its name, guard logic for conditional transitions, and target routes for navigation.
 */
export const useBasketFlows = () => {
  const routing = useRoutingEngine();
  const { meta, setCurrency, isReady } = useBasket();
  const { addMany, isInBasket } = useBasketProductsPending();

  let flows: Flow[] = [
    {
      name: ROUTE.LOADING,
      guard: async (route: Route) => {
        // some query params that we ALWAYS look out for and resolve for the UI:
        // currency,coupons, lang
        const { currency, productConfigs } = useRouteQueryParams(route);
        if (currency) setCurrency(currency);

        // then we sync the product(s) from our Query Params if we have any
        if (productConfigs) addMany(productConfigs);
        return false; //NB ALWAYS return false as we dont want the currentFlow to be Loading, but rather its fallback
      },
      targets: {
        next: [],
        back: [],
        fallback: [
          ROUTE.PRODUCT_ADD,
          // if we have an exact match for our config in the basket,
          // then we can skip the product flow and go straight to the basket
          {
            name: ROUTE.BASKET,
            guard: async (route: Route) => {
              const { productConfig } = useRouteQueryParams(route);
              const valid =
                !!productConfig && (await isInBasket(productConfig));
              return valid;
            }
          },
          ROUTE.PRODUCT_NOT_FOUND,
          ...getCheckoutFlowTargets()
        ]
      }
    },
    {
      name: ROUTE.EMPTY,
      guard: async (_route: Route) =>
        isReady().then(() => !meta.value.hasProducts),
      targets: {
        next: [],
        back: [],
        fallback: getCheckoutFlowTargets()
      }
    },
    {
      name: ROUTE.BASKET,
      guard: async (_route: Route) =>
        isReady().then(() => meta.value.hasProducts),
      resolve: async (_route: Route) => {
        return { name: ROUTE.BASKET };
      },
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.SESSION_REGISTER],
        back: [ROUTE.CATALOGUE],
        fallback: [ROUTE.EMPTY]
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
