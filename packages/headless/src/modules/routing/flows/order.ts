// --- internal
import { useRoutingEngine } from "..";
import { getCheckoutFlowTargets } from "./checkout";

// --- utils
import { uniqBy, isEmpty } from "lodash-es";
import { useRouteQueryParams } from "../utils";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";

// -----------------------------------------------------------------------------

/**
 * Composable function to provide a mechanism to manage and retrieve order-related navigation flows
 * used within the routing engine of an application. It defines and organises flow rules that enforce
 * navigation guards and targets based on specific conditions, such as order validation and query parameters.
 */
export const useOrderFlows = () => {
  const routing = useRoutingEngine();

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
