// --- external

// --- internal
import {
  useRoutingEngine,
  useRouteQueryParams,
  useRouteRequiresAction,
} from "..";
import { useBasketProductsPending } from "../../basketProduct";

import { useBasket } from "../../basket";
import { useProductRecommendations } from "../../recommendations";

// --- utils
import { uniqBy, set, isEmpty } from "lodash-es";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";
import { ActorRef } from "xstate";
import { ProductProps } from "../../product";
import { contextValue, stateMatches } from "../../../utils";

// -----------------------------------------------------------------------------

export const useProductFlows = () => {
  const routing = useRoutingEngine();
  const {
    findProduct,
    productExists,
    getProduct,
    isReady: isBasketReady,
  } = useBasket();

  const {
    get: getPendingProduct,
    remove: removePendingProduct,
    isInBasket,
  } = useBasketProductsPending();

  let flows: Flow[] = [
    {
      name: ROUTE.EXPRESS_PRODUCT_ADD,
      guard: async (route: Route) => {
        const { productId, express } = useRouteQueryParams(route);
        const valid =
          express &&
          (await getPendingProduct(productId)
            .then(
              basketItem =>
                !stateMatches(basketItem.state, ["error", "complete"])
            )
            .catch(() => false));
        return valid;
      },
      resolve: async (route: Route) => {
        const { productId } = useRouteQueryParams(route);
        const product = await getPendingProduct(productId, true).catch(
          () => undefined
        );
        if (!isEmpty(product)) {
          //  updatePendingProduct(product.id);
          return product
            .update()
            .then(async () => {
              removePendingProduct(productId);
              route.name ??= ROUTE.EXPRESS_PRODUCT_ADD; // ensure we have a name for the current route
              return routing.next(route, product);
            })
            .catch(() => {
              return {
                name: ROUTE.PRODUCT_ADD,
                params: { pid: productId },
              };
            });
        } else {
          return {
            name: ROUTE.PRODUCT_NOT_FOUND,
            query: { pid: productId },
          };
        }
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          {
            name: ROUTE.PRODUCT_RECOMMENDATIONS,
            guard: async (route: Route) => {
              const { productId: pid } = useRouteQueryParams(route);
              if (!pid) return false;
              const { meta, isReady } = useProductRecommendations(pid);
              return isReady().then(() => meta.value.hasRecommendations);
            },
            resolve: async (route: Route) => {
              const { productId: pid } = useRouteQueryParams(route);
              return {
                name: ROUTE.PRODUCT_RECOMMENDATIONS,
                params: { pid },
              };
            },
          },
          ROUTE.CHECKOUT,
          ROUTE.SESSION_REGISTER,
          ROUTE.BASKET,
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.PRODUCT_NOT_FOUND],
      },
    },
    {
      name: ROUTE.PRODUCT_ADD,
      guard: async (route: Route) => {
        const { productId, productConfig } = useRouteQueryParams(route);
        const exists = !!productConfig && (await isInBasket(productConfig));
        if (exists) return false;

        const valid = await getPendingProduct(productId, true)
          .then(
            basketItem => !stateMatches(basketItem.state, ["error", "complete"])
          )
          .catch(() => false);
        return valid;
      },
      resolve: async (route: Route) => {
        const { productId } = useRouteQueryParams(route);
        const pendingProduct = await getPendingProduct(productId, true);
        const pid = contextValue<ProductProps["productId"]>(
          pendingProduct.state,
          "model.productId",
          productId
        );
        return {
          name: ROUTE.PRODUCT_ADD,
          params: { pid: pid ?? "" },
        };
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          {
            name: ROUTE.PRODUCT_RECOMMENDATIONS,
            guard: async (route: Route) => {
              const { productId: pid } = useRouteQueryParams(route);
              if (!pid) return false;
              const { meta, isReady } = useProductRecommendations(pid);
              return isReady().then(() => meta.value.hasRecommendations);
            },
            resolve: async (route: Route) => {
              const { productId: pid } = useRouteQueryParams(route);
              return {
                name: ROUTE.PRODUCT_RECOMMENDATIONS,
                params: { pid },
              };
            },
          },
          ROUTE.CHECKOUT,
          ROUTE.SESSION_REGISTER,
          ROUTE.BASKET,
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [
          {
            name: ROUTE.PRODUCT_EDIT,
            guard: async (route: Route) => {
              const { productId } = useRouteQueryParams(route);
              const valid = productExists({ productId });
              return valid;
            },
            resolve: async (route: Route) => {
              const { productId } = useRouteQueryParams(route);
              const basketItem = findProduct({ productId });

              if (!basketItem?.id)
                return {
                  name: ROUTE.PRODUCT_NOT_FOUND,
                  query: { pid: productId },
                };
              else
                return {
                  name: ROUTE.PRODUCT_EDIT,
                  params: { bpid: basketItem?.id },
                };
            },
          },
          ROUTE.PRODUCT_NOT_FOUND,
        ],
      },
    },
    {
      name: ROUTE.PRODUCT_EDIT,
      guard: async (route: Route) => {
        const { basketProductId } = useRouteQueryParams(route);
        return await getProduct(basketProductId)
          .then(() => true)
          .catch(() => false);
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.CHECKOUT,
          ROUTE.SESSION_REGISTER,
          ROUTE.BASKET,
        ],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.PRODUCT_NOT_FOUND],
      },
    },
    {
      name: ROUTE.PRODUCT_REQUIRES_ACTION,
      guard: async (_route: Route) =>
        isBasketReady().then(() => {
          const { hasProducts } = useRouteRequiresAction();
          const valid = hasProducts();
          return valid;
        }),

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
            guard: async (_route: Route, context: any) =>
              isBasketReady().then(() => {
                const { getNextInvalid } = useRouteRequiresAction();
                const valid = !!getNextInvalid(context);
                return valid;
              }),
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
        back: [ROUTE.BASKET],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY],
      },
    },
    {
      name: ROUTE.PRODUCT_NOT_FOUND,
      guard: async (route: Route) => {
        const { productId, basketProductId } = useRouteQueryParams(route);
        return !!productId || !!basketProductId;
      },
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
    {
      name: ROUTE.PRODUCT_RECOMMENDATIONS,
      guard: async (route: Route) => {
        const { productId: pid } = useRouteQueryParams(route);
        if (!pid) return false;
        const { meta, isReady } = useProductRecommendations(pid);
        return isReady().then(() => meta.value.hasRecommendations);
      },
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.SESSION_REGISTER, ROUTE.BASKET],
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
