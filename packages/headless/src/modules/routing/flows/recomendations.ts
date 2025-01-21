// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRecommendationsEngine } from "../../recommendations";
import { useRoutingEngine } from "..";
// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------
export const useRecommendationsFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts } = useBasket();
  const { hasRecommendations } = useRecommendationsEngine();

  let flows: Flow[] = [
    {
      name: ROUTE.RECOMMENDATIONS,
      guard: async (_route: Route) => {
        const valid = hasProducts() && hasRecommendations();
        return valid;
      },
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.SESSION, ROUTE.BASKET],
        back: [ROUTE.BASKET],
        fallback: [ROUTE.BASKET],
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
