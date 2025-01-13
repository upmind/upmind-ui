// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRecommendationsEngine } from "../../recommendations";
import { useRoutingEngine } from "..";
// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------
export const useRecommendationsFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts } = useBasket();
  const { hasRecommendations } = useRecommendationsEngine();

  let flows: Flow[] = [
    {
      id: ROUTE.RECOMMENDATIONS,
      name: "recommendations",
      path: "/product/recommendations",
      // handler: (router: any) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async () => {
        const valid = hasProducts() && hasRecommendations();
        return valid;
      },
      targets: {
        next: [{ id: ROUTE.CHECKOUT }],
        back: [{ id: ROUTE.BASKET }],
        fallback: [{ id: ROUTE.BASKET }],
      },
    },
  ];

  return {
    getFlows: () => flows,
    register: (data?: Flow[]) => {
      flows = uniqBy([...(data ?? []), ...flows], "id");
      routing.register(flows);
    },
  };
};
