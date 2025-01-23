// --- external

// --- internal
import {
  useRoutePendingProducts,
  useRoutingEngine,
  useRouteQueryParams,
  useRouteRequiresAction,
} from "..";

// --- utils
import { uniqBy, set } from "lodash-es";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";

// -----------------------------------------------------------------------------
export const useProductFlows = () => {
  const routing = useRoutingEngine();

  let flows: Flow[] = [
    {
      name: ROUTE.PRODUCT_ADD,
      guard: async (route: Route) => {
        const { getPendingProduct } = useRoutePendingProducts(route);

        const { productId } = useRouteQueryParams(route);
        const valid = await getPendingProduct(productId, true)
          .then(() => true)
          .catch(() => false);
        return valid;
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.RECOMMENDATIONS,
          ROUTE.CHECKOUT,
          ROUTE.SESSION,
          ROUTE.BASKET,
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.PRODUCT_NOT_FOUND],
      },
    },
    {
      name: ROUTE.PRODUCT_EDIT,
      guard: async (route: Route) => {
        const { basketProductId } = useRouteQueryParams(route);
        const { getBasketProduct } = useRoutePendingProducts(route);
        const valid = await getBasketProduct(basketProductId)
          .then(() => true)
          .catch(() => false);
        return valid;
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.RECOMMENDATIONS,
          ROUTE.CHECKOUT,
          ROUTE.SESSION,
          ROUTE.BASKET,
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.PRODUCT_NOT_FOUND],
      },
    },
    {
      name: ROUTE.PRODUCT_REQUIRES_ACTION,
      guard: async (_route: Route) => {
        const { hasProducts } = useRouteRequiresAction();
        const valid = hasProducts();
        return valid;
      },
      resolve: async (_route: Route, context?: any) => {
        const { getNextRelated } = useRouteRequiresAction();
        const basketProduct = getNextRelated(context);
        if (basketProduct) {
          return {
            name: ROUTE.PRODUCT_EDIT,
            params: { bpid: basketProduct?.id },
          };
        }

        return {
          name: ROUTE.PRODUCT_REQUIRES_ACTION,
        };
      },
      targets: {
        next: [
          {
            name: ROUTE.PRODUCT_EDIT,
            guard: async (_route: Route, context: any) => {
              const { getNextInvalid } = useRouteRequiresAction();
              const valid = !!getNextInvalid(context);
              return valid;
            },
            resolve: async (route: Route, context: any) => {
              const { getNextInvalid } = useRouteRequiresAction();
              const basketProduct = getNextInvalid(context);

              if (!basketProduct) return route;
              return {
                name: ROUTE.PRODUCT_EDIT,
                params: { bpid: basketProduct?.id },
              };
            },
          },
        ],
        back: [ROUTE.RECOMMENDATIONS, ROUTE.BASKET],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY],
      },
    },
    {
      name: ROUTE.PRODUCT_NOT_FOUND,
      resolve: async (route: Route) => {
        const { productId, basketProductId } = useRouteQueryParams(route);
        // include the product id in the query params so we can track it in analytics, etc
        const query = {};
        if (productId) set(query, "pid", productId);
        if (basketProductId) set(query, "bpid", basketProductId);
        return {
          name: ROUTE.PRODUCT_NOT_FOUND,
          query,
        };
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
