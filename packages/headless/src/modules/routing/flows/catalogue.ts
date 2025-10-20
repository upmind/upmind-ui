// --- external

// --- internal
import { useBasket } from "../../basket";
import { useBrand } from "../../brand";
import { useRecommendations } from "../../recommendations";
import { useRoutingEngine } from "..";

// --- utils
import { useRouteQueryParams, useRouteRequiresAction } from "../utils";
import { uniqBy } from "lodash-es";

// --- types
import type { Flow, Route } from "../types";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------

export const useCatalogueFlows = () => {
  const routing = useRoutingEngine();
  const { isReady: isReady, uiCart } = useBrand();
  const { setCurrency } = useBasket();
  const { isReady: isBasketReady, meta: basketMeta } = useBasket();
  const { isReady: isRecommndationsReady, meta } = useRecommendations();

  let flows: Flow[] = [
    {
      name: ROUTE.CATALOGUE,
      guard: async (route: Route) => {
        // currency, lang
        const { currency } = useRouteQueryParams(route);
        if (currency) setCurrency(currency);

        // some query params that we ALWAYS look out for and resolve for the UI:
        return await isReady().then(() => !uiCart.value?.catalogue?.disabled);
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.PRODUCT_RECOMMENDATIONS,
          ROUTE.CHECKOUT,
          ROUTE.SESSION_REGISTER,
          ROUTE.BASKET
        ],
        back: [],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
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
            params: { bpid: basketProduct?.id }
          };
        }

        return {
          name: ROUTE.PRODUCT_REQUIRES_ACTION
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
                params: { bpid: basketProduct?.id }
              };
            }
          }
        ],
        back: [ROUTE.BASKET],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
      }
    },
    {
      name: ROUTE.RECOMMENDATIONS,
      guard: async (_route: Route) =>
        isRecommndationsReady().then(() => meta.value.hasRecommendations),
      targets: {
        next: [ROUTE.CHECKOUT, ROUTE.SESSION_REGISTER, ROUTE.BASKET],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.BASKET, ROUTE.EMPTY]
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
