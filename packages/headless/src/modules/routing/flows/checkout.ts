// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";
import { useDataLayer } from "../../system";
const { dataLayer } = useDataLayer();

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
    isReady,
  } = useBasket();
  const { isAuthenticated } = useSession();

  let flows: Flow[] = [
    {
      name: ROUTE.CHECKOUT,
      guard: async (_route: Route) => {
        await isReady();
        const validProducts = hasProducts() && !hasInvalidProducts();
        const validFields = await hasFields();
        const validAuth = await isAuthenticated()
          .then(() => true)
          .catch(() => false);

        return validProducts && validFields && validAuth;
      },
      resolve: async (_route: Route) => {
        // When a user enters the checkout, we want to add this to our dataLayer
        dataLayer({ event: "begin_checkout" }).withEcommerce().push();
        return { name: ROUTE.CHECKOUT };
      },
      targets: {
        next: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => hasOrder(),
            resolve: async (_route: Route) => {
              const invoice = getInvoice();
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice?.id },
                query: { payment_success: isOrderPaid().toString() },
                meta: { replace: true },
              } as Route;
            },
          },
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [
          {
            name: ROUTE.ORDER,
            guard: async (_route: Route) => hasOrder(),
            resolve: async (_route: Route) => {
              const invoice = getInvoice();
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice?.id },
                query: { payment_success: isOrderPaid().toString() },
                meta: { replace: true },
              } as Route;
            },
          },

          {
            name: ROUTE.EMPTY,
            guard: async (_route: Route) =>
              isReady().then(() => !hasProducts()),
          },
          {
            name: ROUTE.BASKET,
            guard: async (_route: Route) =>
              isReady().then(() => hasInvalidProducts()),
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
