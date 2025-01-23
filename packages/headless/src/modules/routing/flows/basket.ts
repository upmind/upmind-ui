// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";

// --- utils
import { useRoutePendingProducts, useRouteQueryParams } from "../utils";
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------
export const useBasketFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts, setCurrency, addPromotion } = useBasket();

  let flows: Flow[] = [
    {
      name: ROUTE.LOADING,
      guard: async (route: Route) => {
        // --------------------------------------------------------
        // some query params that we ALWAYS look out for and resolve for the UI:
        // currency,coupons, lang
        const { currency, coupon } = useRouteQueryParams(route);
        if (currency) setCurrency(currency);
        if (coupon) addPromotion(coupon);

        //  then we can try to sync the pending products, if any
        const { syncPendingProducts } = useRoutePendingProducts(route);
        await Promise.all(syncPendingProducts());

        return false; //NB ALWAYS return false as we dont want the currentFlow to be Loading, but rather its fallback
      },
      targets: {
        next: [],
        back: [],
        fallback: [
          ROUTE.EXPRESS_PRODUCT_ADD,
          ROUTE.PRODUCT_ADD,
          ROUTE.BASKET,
          ROUTE.EMPTY,
        ],
      },
    },
    {
      name: ROUTE.EMPTY,
      guard: async (_route: Route) => !hasProducts(),
      targets: {
        next: [],
        back: [],
        fallback: [ROUTE.BASKET],
      },
    },
    {
      name: ROUTE.BASKET,
      guard: async (_route: Route) => hasProducts(),
      targets: {
        next: [ROUTE.CHECKOUT],
        back: [],
        fallback: [ROUTE.EMPTY],
      },
    },
  ];

  return {
    getFlows: () => flows,
    register: (data?: Flow[]) => {
      flows = uniqBy([...(data ?? []), ...flows], "name");
      routing.register(flows);
    },
  };
};
