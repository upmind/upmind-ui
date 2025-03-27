// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";
import { useDataLayer } from "../../system";
const { dataLayer } = useDataLayer();

// --- utils
import { useRouteQueryParams } from "../utils";
import { useBasketProductsPending } from "../../basketProduct";
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------

export const useBasketFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts, setCurrency, addPromotion, isReady } = useBasket();
  const { sync } = useBasketProductsPending();

  let flows: Flow[] = [
    {
      name: ROUTE.LOADING,
      guard: async (route: Route) => {
        // some query params that we ALWAYS look out for and resolve for the UI:
        // currency,coupons, lang
        const { currency, coupon, productConfigs } = useRouteQueryParams(route);
        if (currency) setCurrency(currency);
        if (coupon) addPromotion(coupon);

        // then we sync the product(s) from our Query Params if we have any
        if (productConfigs) await sync(productConfigs);

        return false; //NB ALWAYS return false as we dont want the currentFlow to be Loading, but rather its fallback
      },
      targets: {
        next: [],
        back: [],
        fallback: [
          ROUTE.EXPRESS_PRODUCT_ADD,
          ROUTE.PRODUCT_ADD,
          ROUTE.PRODUCT_NOT_FOUND,
          ROUTE.BASKET,
          ROUTE.EMPTY,
        ],
      },
    },
    {
      name: ROUTE.EMPTY,
      guard: async (_route: Route) => isReady().then(() => !hasProducts()),
      targets: {
        next: [],
        back: [],
        fallback: [ROUTE.BASKET],
      },
    },
    {
      name: ROUTE.BASKET,
      guard: async (_route: Route) => isReady().then(() => hasProducts()),
      resolve: async (_route: Route) => {
        // When a user enters the basket, we want to add this to our dataLayer
        dataLayer({ event: "view__cart" }).withEcommerce().push();
        return { name: ROUTE.BASKET };
      },
      //  uncomment if we want to FORCE a redirect to a specific path for the basket/flow.
      // eg: ** OPTIONALLY ** if we have an alias for basket that is cart, then the router would force the redirec tto basket
      // othgerwise `/cart` would stil lresolve to the basket flow but not have `/basket` in the url
      // resolve: async (_route: Route) => {
      //   return {
      //     name: ROUTE.BASKET,
      //     path: "/basket",
      //   };
      // },
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
