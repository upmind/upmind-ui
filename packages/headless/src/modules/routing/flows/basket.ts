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
export const useBasketFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts, isEmpty } = useBasket();

  let flows: Flow[] = [
    {
      name: ROUTE.EMPTY,
      // handler: (_context: any, _event: AnyEventObject) => {},
      guard: async (_route: Route) => isEmpty(),
    },
    {
      name: ROUTE.BASKET,
      // handler: (router: any) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async (_route: Route) => hasProducts(),
      targets: {
        next: [{ name: ROUTE.CHECKOUT }],
        back: [],
        fallback: [{ name: ROUTE.EMPTY }],
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
