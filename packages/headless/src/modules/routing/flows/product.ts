// --- external

// --- internal
import { useBasket } from "../../basket";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams } from "../";
import { uniqBy, find, isEmpty, get, has } from "lodash-es";

// --- types
import type { Flow } from "../types";
import { ROUTE } from "../types";
import type { ProductModel } from "../../product/types";

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
      id: ROUTE.PRODUCT_ADD,
      guard: async () => {
        debugger;
        // do logic to determine if we can transition to this node
        const { productId } = useRouteQueryParams();
        debugger;

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
            return addItem(model)
              .then(() => true)
              .catch(() => false);
          }
        } else {
          return false;
        }
      },
      targets: {
        next: [
          // a related product requires action, so we automatically navigate to the related product
          {
            id: ROUTE.PRODUCT_EDIT,
            guard: async () => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            id: ROUTE.PRODUCT_REQUIRES_ACTION,
            guard: async () => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            id: ROUTE.RECOMMENDATIONS,
            guard: async () => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          { id: ROUTE.CHECKOUT },
        ],
        back: [{ id: ROUTE.BASKET }],
        fallback: [{ id: ROUTE.PRODUCT_NOT_FOUND }],
      },
    },
    {
      id: ROUTE.PRODUCT_EDIT,
      guard: async () => {
        const { basketProductId } = useRouteQueryParams();
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
            id: ROUTE.PRODUCT_EDIT,
            guard: async () => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            id: ROUTE.PRODUCT_REQUIRES_ACTION,
            guard: async () => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            id: ROUTE.RECOMMENDATIONS,
            guard: async () => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          { id: ROUTE.CHECKOUT },
        ],
        back: [{ id: ROUTE.BASKET }],
        fallback: [{ id: ROUTE.PRODUCT_NOT_FOUND }],
      },
    },
    {
      id: ROUTE.PRODUCT_REQUIRES_ACTION,
      guard: async () => {
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
