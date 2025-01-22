// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams, useRouteRequiresAction } from "../";
import { uniqBy, find, isEmpty, get, set } from "lodash-es";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";
import type { ProductModel } from "../../product/types";

// -----------------------------------------------------------------------------
export const useProductFlows = () => {
  const routing = useRoutingEngine();
  const { addItem, getPendingProducts, getProducts } = useBasket();

  let flows: Flow[] = [
    {
      name: ROUTE.PRODUCT_ADD,
      guard: async (route: Route) => {
        // do logic to determine if we can transition to this node
        const { productId } = useRouteQueryParams(route);

        if (productId) {
          const productsPending = getPendingProducts();
          const basketItem = find(productsPending, [
            "state.context.model.productId",
            productId,
          ]);

          if (!isEmpty(basketItem)) {
            return true;
          } else {
            // if we have a product id but no basket item, we need to add it
            const pendingBasketItems = getPendingProducts();
            const model = get(pendingBasketItems, productId, {
              productId,
              quantity: 1,
            }) as ProductModel;
            // Try add the item to the basket, if it has an error, then the route is invalid
            const valid = await addItem(model)
              .then(async actor => {
                return waitFor(
                  actor,
                  state => !["loading", "subscribing"].some(state.matches),
                  { timeout: Infinity }
                ).then(state => {
                  return !state.matches("error");
                });
              })
              .catch(() => {
                return false;
              });

            return valid;
          }
        } else {
          return false;
        }
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.RECOMMENDATIONS,
          ROUTE.CHECKOUT,
          ROUTE.SESSION,
          ROUTE.BASKET,
        ],
        back: [ROUTE.BASKET],
        fallback: [ROUTE.PRODUCT_NOT_FOUND],
      },
    },
    {
      name: ROUTE.PRODUCT_EDIT,
      guard: async (route: Route) => {
        const { basketProductId } = useRouteQueryParams(route);
        if (basketProductId) {
          const products = getProducts();
          const basketItem = find(products, ["id", basketProductId]);
          return !isEmpty(basketItem);
        } else {
          return false;
        }
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.RECOMMENDATIONS,
          ROUTE.CHECKOUT,
          ROUTE.SESSION,
          ROUTE.BASKET,
        ],
        back: [ROUTE.BASKET],
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
        fallback: [ROUTE.BASKET],
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
        back: [ROUTE.BASKET],
        fallback: [ROUTE.BASKET],
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
