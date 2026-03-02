import { isEmpty, isString } from "lodash-es";

import {
  type AnyEventObject,
  assign,
  type FunnelContext,
  QUERY_PARAMS,
  useBasket,
  useBasketProductsPending,
  useQueryParams,
  useSession
} from "@upmind-automation/client-vue";
import { ROUTE } from "./types";

// -----------------------------------------------------------------------------

/**
 * Injects bid params into a route target and primes the basket machine.
 * Reads bid from the current route (params or query), falls back to the
 * basket machine's `targetBasketId`.
 *
 * When a bid is found:
 *   1. Calls `setTargetBasket(bid)` so the basket machine loads `orders/{bid}`
 *   2. Strips bid from query to avoid double-presence in URL
 *   3. Injects bid into route params (with `_basket` prefix for non-basket routes)
 *
 * Basket routes (`/order/basket/:bid/...`) only need `{ bid }`.
 * BID_PREFIX routes (`/order/:_basket(basket)?/:bid/...`) need `{ _basket, bid }`.
 *
 * Skips injection for ROUTE.ORDER which has its own `:oid` param.
 */
function injectBid(route: any): any {
  if (!route) return route;

  // Skip ORDER — it has its own :oid param, no bid prefix
  if (route.name === ROUTE.ORDER) return route;

  const { targetBasketId, setTargetBasket } = useBasket();
  const { consumeParam } = useQueryParams();

  // Read bid from the current route (params or query)
  const bid: string | undefined =
    consumeParam(QUERY_PARAMS.BASKET_ID) ?? targetBasketId.value;

  if (!bid) return route;

  // Prime the basket machine to load orders/{bid}.
  // The basket machine's SET_TARGET_BASKET event has an isAuthenticated guard,
  // so this is a no-op when not logged in — preventing 403 API calls.
  if (targetBasketId.value !== bid) setTargetBasket(bid);

  // Basket routes have :bid directly in their path (/order/basket/:bid/...)
  // Other routes use BID_PREFIX (/order/:_basket(basket)?/:bid/...)
  const BASKET_ROUTES: string[] = [
    ROUTE.BASKET,
    ROUTE.BASKET_EMPTY,
    ROUTE.BASKET_PRODUCT_EDIT,
    ROUTE.BASKET_PRODUCT_REQUIRES_ACTION
  ];

  const params = BASKET_ROUTES.includes(route.name)
    ? { bid, ...(route.params || {}) }
    : { _basket: "basket", bid, ...(route.params || {}) };

  return {
    ...route,
    params
  };
}

// -----------------------------------------------------------------------------

/**
 * Actions to perform specific tasks during state transitions.
 * These actions cannot be asynchronous.
 * @param context
 * @returns  void
 */
export default {
  setCurrency: ({ currentRoute }: FunnelContext) => {
    const { setCurrency } = useBasket();
    const { currency } = useQueryParams(currentRoute);
    if (currency) setCurrency(currency);
  },

  setProductConfigs: ({ currentRoute }: FunnelContext) => {
    const { addMany } = useBasketProductsPending();
    const { productConfigs } = useQueryParams(currentRoute);
    if (!isEmpty(productConfigs)) addMany(productConfigs);
  },

  forceAutoupdate: assign({
    currentRoute: ({ currentRoute }: FunnelContext) => {
      if (!currentRoute) return;
      const { getParam } = useQueryParams(currentRoute);
      const autoupdate = getParam("autoupdate", true);
      currentRoute.query.autoupdate = autoupdate ? "true" : "false";
      return currentRoute;
    }
  }),

  // Force end the session by logging out the user
  logout: () => {
    const { logout } = useSession();
    logout();
  },

  /**
   * Overrides the headless setResolved to auto-inject bid params into
   * targetRoute. This is the single hook point for bid preservation —
   * every state that resolves via setResolved gets bid params injected
   * into the route automatically, so individual transitions don't need
   * to worry about it.
   */
  setResolved: assign({
    targetRoute: (context: FunnelContext, { data }: AnyEventObject) => {
      const target = isString(data?.target)
        ? { name: data.target }
        : data?.target;

      return injectBid(target ?? context.targetRoute);
    },
    resolved: true
  })
};
