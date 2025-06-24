// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRecommendations } from "../../recommendations";
import { useRoutingEngine } from "..";
// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------

export const useRecommendationsFlows = () => {
  const routing = useRoutingEngine();
  const { meta: basketMeta } = useBasket();
  const { isReady, meta } = useRecommendations();

  let flows: Flow[] = [
    {
      name: ROUTE.RECOMMENDATIONS,
      guard: async (_route: Route) =>
        isReady().then(
          () => basketMeta.value.hasProducts && meta.value.hasRecommendations
        ),
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.SESSION_REGISTER, ROUTE.BASKET],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY],
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
