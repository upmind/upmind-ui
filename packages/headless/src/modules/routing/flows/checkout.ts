// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";
// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------
export const useCheckoutFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts, needsAuth } = useBasket();

  let flows: Flow[] = [
    {
      id: ROUTE.CHECKOUT,
      name: "checkout",
      path: "/checkout",
      // handler: (router: any) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async (_route: Route) => {
        const valid = hasProducts() && !needsAuth();
        return valid;
      },
      targets: {
        next: [{ id: ROUTE.ORDER }],
        back: [{ id: ROUTE.BASKET }],
        fallback: [
          {
            id: ROUTE.SESSION,
            guard: async (_route: Route) => needsAuth(),
          },
          { id: ROUTE.BASKET },
        ],
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
