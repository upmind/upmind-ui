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
  const { hasProducts, hasInvalidProducts, hasFields, needsAuth } = useBasket();

  let flows: Flow[] = [
    {
      name: ROUTE.CHECKOUT,
      // handler: (router: any, route: Route) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async (_route: Route) =>
        hasProducts() && !hasInvalidProducts() && hasFields() && !needsAuth(),

      targets: {
        next: [{ name: ROUTE.ORDER }],
        back: [{ name: ROUTE.BASKET }],
        fallback: [
          {
            name: ROUTE.SESSION,
            guard: async (_route: Route) => needsAuth(),
          },
          { name: ROUTE.BASKET },
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
