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
      id: ROUTE.EMPTY,
      // handler: (_context: any, _event: AnyEventObject) => {},
      guard: async (_route: Route) => isEmpty(),
    },
    {
      id: ROUTE.BASKET,
      name: "cart",
      path: "/cart",
      // handler: (router: any) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async (_route: Route) => hasProducts(),
      targets: {
        next: [{ id: ROUTE.CHECKOUT }],
        back: [],
        fallback: [{ id: ROUTE.EMPTY }],
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
