// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";
// --- utils
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";
import { useSession } from "../../session";

// -----------------------------------------------------------------------------
export const useCheckoutFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts, hasInvalidProducts, hasFields, needsAuth } = useBasket();
  const { isAuthenticated } = useSession();

  let flows: Flow[] = [
    {
      name: ROUTE.CHECKOUT,
      // handler: (router: any, route: Route) => {
      //   router.push(`/product/recommendations`);
      // },
      guard: async (_route: Route) => {
        const validProducts = hasProducts() && !hasInvalidProducts();
        const validFields = await hasFields();
        const validAuth = await isAuthenticated()
          .then(() => true)
          .catch(() => false);
        return validProducts && validFields && validAuth;
      },
      targets: {
        next: [ROUTE.ORDER],
        back: [ROUTE.BASKET],
        fallback: [
          {
            name: ROUTE.EMPTY,
            guard: async (_route: Route) => !hasProducts(),
          },
          {
            name: ROUTE.BASKET,
            guard: async (_route: Route) => hasInvalidProducts(),
          },
          {
            name: ROUTE.SESSION,
            guard: async (_route: Route) => needsAuth(),
          },
        ],
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
