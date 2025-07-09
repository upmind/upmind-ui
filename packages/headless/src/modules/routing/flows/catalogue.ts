// --- external

// --- internal
import { useBasket } from "../../basket";
import { useBrand } from "../../brand";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams } from "../utils";
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------

export const useCatalogueFlows = () => {
  const routing = useRoutingEngine();
  const { isReady, uiCart } = useBrand();
  const { setCurrency, addPromotion } = useBasket();

  let flows: Flow[] = [
    {
      name: ROUTE.CATALOGUE,
      guard: async (route: Route) => {
        // currency,coupons, lang
        const { currency, coupon } = useRouteQueryParams(route);
        if (currency) setCurrency(currency);
        if (coupon) addPromotion(coupon);

        // some query params that we ALWAYS look out for and resolve for the UI:
        return await isReady().then(() => !uiCart.value?.catalogue?.disabled);
      },
      targets: {
        next: [],
        back: [],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
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
