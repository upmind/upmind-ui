import { isEmpty, isString } from "lodash-es";

import {
  type AnyEventObject,
  assign,
  type FunnelContext,
  QUERY_PARAMS,
  useBasket,
  useBasketProductsPending,
  useQueryParams,
  useRoutingEngine,
  useSession
} from "@upmind-automation/client-vue";
import { ROUTE } from "../types";
import { applyBillingDefaults } from "./services";

// -----------------------------------------------------------------------------

/**
 * Routes whose path uses `/order/basket/:bid?/...` directly (no `:segment`).
 * These only need `{ bid }` — injecting `segment` would be discarded by
 * Vue Router and can cause infinite redirect loops.
 */
const BASKET_ROUTES: string[] = [
  ROUTE.BASKET,
  ROUTE.BASKET_EMPTY,
  ROUTE.BASKET_PRODUCT_EDIT,
  ROUTE.BASKET_PRODUCT_REQUIRES_ACTION
];

/**
 * Routes that should never receive bid params.
 */
const SKIP_BID_ROUTES: string[] = [
  ROUTE.ORDER,
  ROUTE.ERROR,
  ROUTE.BASKET_UNAVAILABLE,
  ROUTE.SESSION_END
];

/**
 * Injects bid params into a route target and primes the basket machine.
 * Reads bid from the current route (params or query), falls back to the
 * basket machine's `targetBasketId`.
 *
 * When a bid is found:
 *   1. Calls `setTargetBasket(bid)` so the basket machine loads `orders/{bid}`
 *   2. For basket routes (`:bid` only): injects `{ bid }`
 *   3. For BID_PREFIX routes (`:segment/:bid`): injects `{ segment: "basket", bid }`
 *
 * When the basket is unavailable:
 *   - Redirects to the unavailable route.
 *
 * Skips injection for ORDER, ERROR, BASKET_UNAVAILABLE, SESSION_END.
 */
function injectBid(route: any): any {
  if (!route) return route;

  // Skip routes that don't support bid params
  if (SKIP_BID_ROUTES.includes(route.name)) return route;

  const { currentRoute } = useRoutingEngine();
  const { targetBasketId, setTargetBasket, meta } = useBasket();
  const { getParam } = useQueryParams(route);

  // If navigating FROM unavailable, don't inject bid — let user navigate freely
  // (isUnavailable may already be false due to reset() being called before navigation)
  // Clear targetBasketId to prevent subsequent navigations from re-injecting it
  if (
    currentRoute.value.name === ROUTE.BASKET_UNAVAILABLE ||
    meta.value.isUnavailable
  ) {
    setTargetBasket(undefined);
    return route;
  }

  // Read bid: getParam first (via query), then basket machine state
  const bid: string | undefined = getParam(
    QUERY_PARAMS.BASKET_ID,
    targetBasketId.value
  );

  if (!bid) return route;

  // Prime the basket machine to load orders/{bid}.
  // SET_TARGET_BASKET has an isAuthenticated guard — no-op when not logged in.
  if (targetBasketId.value !== bid) {
    setTargetBasket(bid);
  }

  // Basket routes use `:bid` directly — no `:segment` param.
  // BID_PREFIX routes use `:segment(basket)?/:bid?` — need both.
  const isBasketRoute = BASKET_ROUTES.includes(route.name);
  const isValidBasket = meta.value.isAvailable;
  const bidParams =
    isBasketRoute || !isValidBasket ? { bid } : { segment: "basket", bid };

  return {
    ...route,
    params: { ...bidParams, ...(route.params || {}) }
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
   * Prime the basket machine with the target basket ID from the current route.
   * Fires synchronously on funnel entry — before any async guards run —
   * so the machine stores the ID while still in `subscribing` state.
   * When `SESSION` fires next, the first `load` already uses `orders/{id}`.
   */
  setBasket: ({ currentRoute }: FunnelContext) => {
    if (!currentRoute) return;
    const { getParam } = useQueryParams(currentRoute);
    const bid = getParam(QUERY_PARAMS.BASKET_ID);
    if (bid) {
      const { setTargetBasket } = useBasket();
      setTargetBasket(bid); // fire-and-forget: sends SET_TARGET_BASKET to the machine
    }
  },

  /**
   * Sets billing defaults from the client's default address, company, and phone.
   * Fire-and-forget — uses the shared `applyBillingDefaults` helper.
   */
  setBillingDefaults: () => {
    applyBillingDefaults();
  },

  /**
   * Clears the target basket ID so subsequent navigations don't try to load a stale/unavailable basket.
   * Called on entry to basket-unavailable state.
   */
  clearBasket: () => {
    const { setTargetBasket } = useBasket();
    setTargetBasket(undefined);
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

      const result = injectBid(target ?? context.targetRoute);
      console.debug("[cart:setResolved]", {
        targetRoute: result?.name,
        dataTarget: data?.target?.name,
        contextTarget: context.targetRoute?.name
      });
      return result;
    },
    resolved: true
  }),

  /**
   * Resolves the returnUrl from targetRoute.query and sets it as the target.
   * Used after auth success to redirect to the originally requested page.
   */
  resolveReturnUrl: assign({
    targetRoute: ({ targetRoute }: FunnelContext) => {
      const returnUrl =
        targetRoute?.query?.[QUERY_PARAMS.RETURN_URL]?.toString();
      if (!returnUrl) return targetRoute;

      const { router } = useRoutingEngine();
      const resolved = router.resolve(returnUrl);
      return injectBid(resolved);
    },
    resolved: true
  })
};
