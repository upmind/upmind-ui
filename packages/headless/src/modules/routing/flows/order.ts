// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams } from "../utils";
import { uniqBy, isEmpty } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";
// import { useSession } from "../../session";

// -----------------------------------------------------------------------------

export const useOrderFlows = () => {
  const routing = useRoutingEngine();
  const { hasOrder, isReady, hasProducts } = useBasket();
  // const { isAuthenticated, hasExpired } = useSession();

  let flows: Flow[] = [
    {
      name: ROUTE.ORDER,
      guard: async (route: Route) => {
        const { getParam, parse } = useRouteQueryParams(route);
        const orderId = parse(getParam("orderId"));
        return !isEmpty(orderId);

        // TODO: succss/failed/expired sub routes
        // const success = parse(getParam("payment_success"));
        // const expired = parse(getParam("payment_success"));

        // TODO: fetch actual order status based on orderId
        // const validOrder = isOrderComplete();
        // const validAuth =
        //   (await isAuthenticated()) &&
        //   !hasExpired()
        //     .then(() => true)
        //     .catch(() => false);

        // return validOrder && validAuth;
      },
      targets: {
        next: [],
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
