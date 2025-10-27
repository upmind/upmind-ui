/**
 * NB this is not being used at the moment, but is here for future use
 * as we may want to use this for product flows in the future.
 * Specifically when we want to skip the recommendations and go straight to checkout.
 */
// --- external

// --- internal
import { useRoutingEngine, useRouteQueryParams } from "..";
import { useBasketProductsPending } from "../../basketProduct";

// --- utils
import { uniqBy, set, isEmpty } from "lodash-es";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";
import { stateMatches } from "../../../utils";
import { getCheckoutFlowTargets } from "./checkout";

// -----------------------------------------------------------------------------

export const useProductFlows = () => {
  const routing = useRoutingEngine();

  const { get: getPendingProduct, resolve } = useBasketProductsPending();

  // --- utils

  let flows: Flow[] = [
    {
      name: ROUTE.EXPRESS_PRODUCT_ADD,
      guard: async (route: Route) => {
        const { productId } = useRouteQueryParams(route);
        const basketItem = await getPendingProduct(productId).catch(
          () => undefined
        );
        const valid = basketItem
          ? !stateMatches(basketItem.state, ["error", "complete"])
          : false;

        return valid;
      },
      resolve: async (route: Route) => {
        const { productId: pid } = useRouteQueryParams(route);
        const product = await getPendingProduct(pid).catch(() => undefined);

        if (isEmpty(product?.service)) {
          return {
            name: ROUTE.PRODUCT_NOT_FOUND,
            query: { pid }
          };
        }
        return product
          .update()
          .then(async () => {
            resolve(product.service);
            route.name ??= ROUTE.EXPRESS_PRODUCT_ADD; // ensure we have a name for the current route
            return routing.next(route, product.service);
          })
          .catch(() => {
            return {
              name: ROUTE.PRODUCT_ADD,
              params: { pid }
            };
          });
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.PRODUCT_RECOMMENDATIONS,
          ...getCheckoutFlowTargets()
        ],
        back: getCheckoutFlowTargets(),
        fallback: [ROUTE.PRODUCT_NOT_FOUND]
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
