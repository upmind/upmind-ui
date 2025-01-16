// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";

// --- utils
import { useRoutePendingProducts } from "../utils";
import { uniqBy, get } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------
export const useBasketFlows = () => {
  const routing = useRoutingEngine();
  const { hasProducts, isEmpty } = useBasket();

  let flows: Flow[] = [
    {
      name: ROUTE.LOADING,
      guard: async (_route: Route) => false, // force to go to the next route
      targets: {
        next: [],
        back: [],
        fallback: [
          {
            name: ROUTE.PRODUCT_ADD,
            guard: async (route: Route) => {
              const { syncPendingProducts, hasPendingProducts } =
                useRoutePendingProducts(route);
              await Promise.all(syncPendingProducts());
              return hasPendingProducts();
            },
            resolve: async (route: Route) => {
              const { getPendingProduct } = useRoutePendingProducts(route);
              const product = await getPendingProduct();
              const pid = get(product.getSnapshot(), "context.model.productId");
              if (pid) {
                return {
                  name: ROUTE.PRODUCT_ADD,
                  params: { pid },
                };
              }
              return Promise.reject();
            },
          },
        ],
      },
    },
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
