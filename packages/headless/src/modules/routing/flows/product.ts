// --- internal
import {
  useRoutingEngine,
  useRouteQueryParams,
  useRouteRequiresAction
} from "..";
import { useBasketProductsPending } from "../../basketProduct";
import { getCheckoutFlowTargets } from "./checkout";
import { useBasket } from "../../basket";
import { useProductRecommendations } from "../../recommendations";

// --- utils
import { uniqBy, set, isEmpty } from "lodash-es";

// --- types
import { ROUTE } from "../types";
import type { Flow, Route } from "../types";
import type { ProductProps } from "../../product";
import { contextValue, stateMatches } from "../../../utils";

// -----------------------------------------------------------------------------

/**
 * Composable function to provide functionality to manage and execute product flows used in e-commerce applications.
 *
 * This function defines and manages a set of flows related to product-related operations
 * such as adding, editing, and resolving products in the shopping basket. It includes guard
 * conditions and resolution logic for determining the next actions, along with navigation
 * targets for each flow. The hooks leveraged within the flows enable interaction with the
 * routing engine, basket system, and other modules for product and recommendation handling.
 */
export const useProductFlows = () => {
  const routing = useRoutingEngine();
  const {
    findProduct,
    getProduct,
    isReady: isBasketReady,
    productExists,
    setCurrency
  } = useBasket();

  const {
    exists: productPendingExists,
    get: getPendingProduct,
    add,
    addMany,
    resolve,
    isInBasket
  } = useBasketProductsPending();

  // --- utils

  let flows: Flow[] = [
    {
      name: ROUTE.PRODUCT_ADD,
      guard: async (route: Route) => {
        // some query params that we ALWAYS look out for and resolve for the UI:
        // currency,coupons, lang
        let { currency, productConfig, productId, getParam } =
          useRouteQueryParams(route);

        // NB if we have a currency, then set it and await the returned currency id to pass to the product config
        if (currency) setCurrency(currency);
        if (productConfig) addMany([productConfig]);

        // honour the flag to ensure we always add the product, even if it exists in the basket
        const force = JSON.parse(getParam("force", false));

        // if already have an exact product in the basket, and we are NOT force adding, then we can skip
        const skip =
          !force && !!productConfig && (await isInBasket(productConfig));
        if (skip) return false;

        // otherwise ensure we have a valid product
        const basketItem = await (
          !productPendingExists(productId)
            ? add(
                productId,
                productConfig ?? {
                  productId,
                  quantity: 1
                },
                force
              )
            : getPendingProduct(productId, true, force)
        ).catch((error: any) => {
          console.error("Error getting pending product:", error);
        });

        return (
          !!basketItem && !stateMatches(basketItem.state, ["error", "complete"])
        );
      },
      resolve: async (route: Route) => {
        const { productId, express, getParam } = useRouteQueryParams(route);

        // honour the flag to force navigate to the product page
        const navigate = JSON.parse(getParam("navigateOnly", false));

        const product = await getPendingProduct(productId).catch(
          () => undefined
        );

        if (isEmpty(product?.service))
          return {
            name: ROUTE.PRODUCT_NOT_FOUND,
            query: { pid: productId }
          };

        // NB this allows us to navigate to a product page without a given productId
        // this is helpful for people returning to the cart that had prev added a product config without completing it
        const pid =
          productId ??
          contextValue<ProductProps["productId"]>(
            product.state,
            "model.productId"
          );

        if (express || (!navigate && !product?.meta.value.isConfigurable))
          return product
            .update()
            .then(async () => {
              resolve(product.service);
              route.name ??= ROUTE.PRODUCT_ADD; // ensure we have a name for the current route
              return routing.next(route, product.service);
            })
            .catch(() => {
              return {
                name: ROUTE.PRODUCT_ADD,
                params: { pid }
              };
            });

        return {
          name: ROUTE.PRODUCT_ADD,
          params: { pid }
        };
      },
      targets: {
        next: [
          ROUTE.PRODUCT_REQUIRES_ACTION,
          ROUTE.PRODUCT_RECOMMENDATIONS,
          ...getCheckoutFlowTargets()
        ],
        back: [ROUTE.CATALOGUE, ROUTE.BASKET, ROUTE.EMPTY],
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
                  query: { pid: productId }
                };
              else
                return {
                  name: ROUTE.PRODUCT_EDIT,
                  params: { bpid: basketItem?.id }
                };
            }
          },
          ROUTE.PRODUCT_NOT_FOUND,
          ROUTE.CATALOGUE
        ]
      }
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
        next: [ROUTE.PRODUCT_REQUIRES_ACTION, ...getCheckoutFlowTargets()],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: [ROUTE.PRODUCT_NOT_FOUND]
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
        back: getCheckoutFlowTargets(),
        fallback: getCheckoutFlowTargets()
      }
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
          query
        };
      },
      targets: {
        next: [],
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: getCheckoutFlowTargets()
      }
    },
    {
      name: ROUTE.PRODUCT_RECOMMENDATIONS,
      guard: async (route: Route) => {
        const { productId: pid } = useRouteQueryParams(route);
        if (!pid) return false;
        const { meta, isReady } = useProductRecommendations(pid);
        return isReady().then(() => {
          return meta.value.hasUnseenRecommendations;
        });
      },
      resolve: async (route: Route) => {
        const { productId: pid } = useRouteQueryParams(route);
        return {
          name: ROUTE.PRODUCT_RECOMMENDATIONS,
          params: { pid }
        };
      },
      targets: {
        next: getCheckoutFlowTargets(),
        back: [ROUTE.BASKET, ROUTE.EMPTY],
        fallback: getCheckoutFlowTargets()
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
