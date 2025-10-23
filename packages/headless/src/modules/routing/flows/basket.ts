// --- external

// --- internal
import { useBasket } from "../../basket";
import { useBrand } from "../../brand";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams } from "../utils";
import { useBasketProductsPending } from "../../basketProduct";
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";
import { BrandConfigKeys, CheckoutFlows } from "@upmind-automation/types";
import { getCheckoutFlowTargets } from "./checkout";

// -----------------------------------------------------------------------------

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
