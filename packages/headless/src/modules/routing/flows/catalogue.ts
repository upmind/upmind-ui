// --- external

// --- internal
import { useBasket } from "../../basket";
import { useBrand } from "../../brand";
import { useRecommendations } from "../../recommendations";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams, useRouteRequiresAction } from "../utils";
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";
import { getCheckoutFlowTargets } from "./checkout";

// -----------------------------------------------------------------------------

export const useCatalogueFlows = () => {
  const routing = useRoutingEngine();
  const { isReady: isReady, uiCart } = useBrand();
  const { setCurrency } = useBasket();
  const { isReady: isBasketReady, meta: basketMeta } = useBasket();
  const { isReady: isRecommndationsReady, meta } = useRecommendations();

  let flows: Flow[] = [
    {
      name: ROUTE.CATALOGUE,
      guard: async (route: Route) => {
        // currency, lang
        const { currency } = useRouteQueryParams(route);
        if (currency) setCurrency(currency);

        // some query params that we ALWAYS look out for and resolve for the UI:
        return await isReady().then(() => !uiCart.value?.catalogue?.disabled);
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.RECOMMENDATIONS,
          ...getCheckoutFlowTargets()
        ],
        back: getCheckoutFlowTargets(),
        fallback: getCheckoutFlowTargets()
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
