// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams } from "../";
import { uniqBy, find, isEmpty, get } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

import type { ProductModel } from "../../product/types";
import { waitFor } from "xstate/lib/waitFor";

// -----------------------------------------------------------------------------
export const useProductFlows = () => {
  const routing = useRoutingEngine();
  const { addItem, getPendingProducts, getProducts } = useBasket();

  let flows: Flow[] = [
    // {
    //       const animation = new Promise(resolve => setTimeout(resolve, 2_000));
    // await Promise.all(syncPendingBasketItems());
    // await animation; // ensure we wait for the animation to complete
    // // finally navigate to the next basket route
    // navigateNextBasketItem();
    // },
    // ---

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
          // a related product requires action, so we automatically navigate to the related product
          {
            name: ROUTE.PRODUCT_EDIT,
            guard: async (_route: Route) => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            name: ROUTE.PRODUCT_REQUIRES_ACTION,
            guard: async (_route: Route) => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            name: ROUTE.RECOMMENDATIONS,
            guard: async (_route: Route) => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          { name: ROUTE.CHECKOUT },
        ],
        back: [{ name: ROUTE.BASKET }],
        fallback: [{ name: ROUTE.PRODUCT_NOT_FOUND }],
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
          {
            name: ROUTE.PRODUCT_EDIT,
            guard: async (_route: Route) => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            name: ROUTE.PRODUCT_REQUIRES_ACTION,
            guard: async (_route: Route) => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            name: ROUTE.RECOMMENDATIONS,
            guard: async (_route: Route) => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          { name: ROUTE.CHECKOUT },
        ],
        back: [{ name: ROUTE.BASKET }],
        fallback: [{ name: ROUTE.PRODUCT_NOT_FOUND }],
      },
    },
    {
      name: ROUTE.PRODUCT_REQUIRES_ACTION,
      guard: async (_route: Route) => {
        // do logic to determine if we can transition to this node
        const valid = true || false;
        return valid;
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
