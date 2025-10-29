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
import { getCheckoutFlowTargets } from "./checkout";

// -----------------------------------------------------------------------------

/**
 * Composable function to provide functionality to manage and register recommendation flows for a routing engine.
 *
 * The `useRecommendationsFlows` function creates a configuration for recommendation-based routing flows
 * that includes route guards to validate conditions and defines possible navigation targets.
 * It also allows for the retrieval and dynamic registration of additional flows.
 */
export const useRecommendationsFlows = () => {
  const routing = useRoutingEngine();
  const { meta: basketMeta } = useBasket();
  const { isReady, meta } = useRecommendations();

  let flows: Flow[] = [
    {
      name: ROUTE.RECOMMENDATIONS,
      guard: async (_route: Route) =>
        isReady().then(
          () =>
            basketMeta.value.hasProducts && meta.value.hasUnseenRecommendations
        ),
      targets: {
        next: getCheckoutFlowTargets(),
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
