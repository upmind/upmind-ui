// --- internal
import { useBasket } from "../../basket";
import { useBrand } from "../../brand";
import { useRoutingEngine } from "..";
import { getCheckoutFlowTargets } from "./checkout";

// --- utils
import { uniqBy } from "lodash-es";
import { useRouteQueryParams } from "../utils";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";

// -----------------------------------------------------------------------------

/**
 * Composable function to manage the catalogue-related flows.
 * It provides mechanisms to define navigation rules, manage their states, and register them with the routing system.
 * Each flow specifies its name, guard logic for conditional transitions, and target routes for navigation.
 */
export const useCatalogueFlows = () => {
  const routing = useRoutingEngine();
  const { isReady: isReady, uiCart } = useBrand();
  const { setCurrency } = useBasket();

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
