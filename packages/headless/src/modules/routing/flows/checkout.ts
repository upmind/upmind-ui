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
  const {
    hasProducts,
    hasInvalidProducts,
    hasFields,
    hasOrder,
    isOrderPaid,
    getInvoice,
  } = useBasket();
  const { isAuthenticated } = useSession();

  let flows: Flow[] = [
    {
      name: ROUTE.CHECKOUT,
      guard: async (_route: Route) => {
        const validProducts = hasProducts() && !hasInvalidProducts();
        const validFields = await hasFields();
        const validAuth = await isAuthenticated()
          .then(() => true)
          .catch(() => false);

        return validProducts && validFields && validAuth;
      },
      targets: {
        next: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => {
              const valid = hasOrder();
              return valid;
            },
            resolve: async (_route: Route) => {
              const invoice = getInvoice();
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice?.id },
                query: { payment_success: isOrderPaid().toString() },
                meta: { replace: true },
              };
            },
          },
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => {
              const valid = hasOrder();
              return valid;
            },
            resolve: async (_route: Route) => {
              const invoice = getInvoice();
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice?.id },
                query: { payment_success: isOrderPaid().toString() },
                meta: { replace: true },
              };
            },
          },
          {
            name: ROUTE.EMPTY,
            guard: async (_route: Route) => !hasProducts(),
          },
          {
            name: ROUTE.BASKET,
            guard: async (_route: Route) => hasInvalidProducts(),
          },
          {
            name: ROUTE.SESSION_REGISTER,
            guard: async (_route: Route) => {
              const validAuth = await isAuthenticated()
                .then(() => true)
                .catch(() => false);
              return !validAuth;
            },
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
