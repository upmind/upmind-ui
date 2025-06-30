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
  const { meta: basketMeta, invoice, isReady } = useBasket();
  const { meta: sessionMeta } = useSession();

  let flows: Flow[] = [
    {
      name: ROUTE.CHECKOUT,
      guard: async (_route: Route) => {
        await isReady();
        const validProducts =
          basketMeta.value.hasProducts && !basketMeta.value.hasInvalidProducts;
        const validFields = basketMeta.value.hasFields;
        const validAuth = sessionMeta.value.isAuthenticated;

        return validProducts && validFields && validAuth;
      },
      resolve: async (_route: Route) => {
        return { name: ROUTE.CHECKOUT };
      },
      targets: {
        next: [
          {
            name: ROUTE.ORDER,
            meta: { replace: true },
            guard: async (_route: Route) => basketMeta.value.isComplete,
            resolve: async (_route: Route) => {
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice.value?.id },
                query: {
                  payment_success: basketMeta.value.hasPaid.toString()
                }
              } as Route;
            }
          }
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [
          {
            name: ROUTE.ORDER,
            meta: { replace: true },
            guard: async (_route: Route) => basketMeta.value.isComplete,
            resolve: async (_route: Route) => {
              return {
                name: ROUTE.ORDER,
                params: { orderId: invoice.value?.id },
                query: { payment_success: basketMeta.value.hasPaid.toString() }
              } as Route;
            }
          },

          {
            name: ROUTE.EMPTY,
            guard: async (_route: Route) =>
              isReady().then(() => !basketMeta.value.hasProducts)
          },
          {
            name: ROUTE.BASKET,
            guard: async (_route: Route) =>
              isReady().then(() => basketMeta.value.hasInvalidProducts)
          },
          {
            name: ROUTE.SESSION_REGISTER,
            guard: async (_route: Route) => {
              const validAuth = sessionMeta.value.isAuthenticated;
              return !validAuth;
            }
          }
        ]
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
