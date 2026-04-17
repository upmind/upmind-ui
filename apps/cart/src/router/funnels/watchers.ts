// --- external
import { watch } from "vue";

// --- internal
import {
  stateMatches,
  useBasket,
  useRoutingEngine,
  useSession
} from "@upmind-automation/client-vue";

// --- types
import type { FunnelWatcher } from "@upmind-automation/client-vue";
import { ROUTE } from "./types";

// -----------------------------------------------------------------------------

/**
 * @module funnels/watchers
 * @description Reactive funnel watchers for session and basket state changes.
 * These integrate with the routing engine's watcher lifecycle
 * (start on funnel available, cleanup on exit) and use navigate()
 * to route through the funnel machine rather than router.push() directly —
 * avoiding a full middleware cascade on every reactive redirect.
 */

// -----------------------------------------------------------------------------

/**
 * Watches for session logout and redirects to the session end page.
 * Triggers when isAuthenticated transitions from true → false.
 */
const sessionLogout: FunnelWatcher = {
  id: "session-logout",
  handler: () => {
    const { meta: routingMeta, navigate } = useRoutingEngine();
    const { subscribe, meta: sessionMeta } = useSession();

    let wasAuthenticated = sessionMeta.value.isAuthenticated;

    const { unsubscribe } = subscribe(state => {
      const isAuthenticated = stateMatches(state, "client");
      const didLogout = !isAuthenticated && wasAuthenticated;
      wasAuthenticated = isAuthenticated;

      if (!didLogout) return;

      if (routingMeta.value.isResolved) {
        navigate({ name: ROUTE.SESSION_END });
      } else {
        // Await resolution then navigate if not already at SESSION_END
        const stop = watch(routingMeta, ({ isResolved }) => {
          if (!isResolved) return;
          stop();
          navigate({ name: ROUTE.SESSION_END });
        });
      }
    });

    return unsubscribe;
  }
};

/**
 * Watches for basket becoming unavailable and redirects accordingly.
 * Triggers when isUnavailable transitions from false → true while authenticated.
 */
const basketUnavailable: FunnelWatcher = {
  id: "basket-unavailable",
  handler: () => {
    const { meta: routingMeta, navigate } = useRoutingEngine();
    const { meta: basketMeta } = useBasket();
    const { meta: sessionMeta } = useSession();

    let wasUnavailable = basketMeta.value.isUnavailable;

    const stop = watch(basketMeta, ({ isUnavailable }) => {
      const becameUnavailable =
        isUnavailable && !wasUnavailable && sessionMeta.value.isAuthenticated;
      wasUnavailable = isUnavailable;

      if (!routingMeta.value.isResolved) return;

      if (becameUnavailable) {
        navigate({ name: ROUTE.BASKET_UNAVAILABLE });
      }
    });

    return stop;
  }
};

/**
 * Watches for basket becoming empty and redirects to the empty basket page.
 * Triggers when hasProducts transitions from true → false while not in checkout/complete.
 */
const basketEmpty: FunnelWatcher = {
  id: "basket-empty",
  handler: () => {
    const { meta: routingMeta, navigate } = useRoutingEngine();
    const { meta: basketMeta } = useBasket();

    let hadProducts = basketMeta.value.hasProducts;

    const stop = watch(
      basketMeta,
      ({ hasProducts, isUnavailable, isCheckout, isComplete }) => {
        const becameEmpty =
          !isUnavailable &&
          !hasProducts &&
          hadProducts &&
          !isCheckout &&
          !isComplete;
        hadProducts = hasProducts;

        if (!routingMeta.value.isResolved) return;

        if (becameEmpty) {
          navigate({ name: ROUTE.BASKET_EMPTY });
        }
      }
    );

    return stop;
  }
};

// -----------------------------------------------------------------------------

export const watchers: FunnelWatcher[] = [
  basketEmpty,
  basketUnavailable,
  sessionLogout
];
