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
  const { hasProducts, isEmpty, setCurrency, addPromotion } = useBasket();

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

        return false;
      },
      targets: {
        next: [],
        back: [],
        fallback: [
          {
            name: ROUTE.PRODUCT_ADD,
            guard: async (route: Route) => {
              const { hasPendingProducts } = useRoutePendingProducts(route);
              const valid = hasPendingProducts();
              return valid;
            },
            resolve: async (route: Route) => {
              const { getPendingProduct } = useRoutePendingProducts(route);
              const { productId } = useRouteQueryParams(route);
              return await getPendingProduct(productId)
                .then(() => ({
                  name: ROUTE.PRODUCT_ADD,
                  params: { pid: productId },
                }))
                .catch(() => ({
                  name: ROUTE.PRODUCT_NOT_FOUND,
                  query: { pid: productId },
                }));
            },
          },
          ROUTE.BASKET,
          ROUTE.EMPTY,
        ],
      },
    },
    {
      name: ROUTE.EMPTY,
      guard: async (_route: Route) => isEmpty(),
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
