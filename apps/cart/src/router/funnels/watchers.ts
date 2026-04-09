// --- external
import { watch } from "vue";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useSession
} from "@upmind-automation/client-vue";

// --- types
import type { FunnelWatcher } from "@upmind-automation/client-vue";
import { ROUTE } from "../types";

// -----------------------------------------------------------------------------

/**
 * @module router/watchers
 * @description Reactive funnel watchers for session and basket state changes.
 * These replace the legacy App.vue watcher by integrating with the routing
 * engine's watcher lifecycle (start on funnel available, cleanup on exit).
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
    const { meta: sessionMeta } = useSession();

    let wasAuthenticated = sessionMeta.value.isAuthenticated;

    const stop = watch(sessionMeta, ({ isAuthenticated }) => {
      if (!routingMeta.value.isResolved) return;

      if (!isAuthenticated && wasAuthenticated) {
        navigate({ name: ROUTE.SESSION_END });
      }

      wasAuthenticated = isAuthenticated;
    });

    return stop;
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
      if (!routingMeta.value.isResolved) return;

      if (
        isUnavailable &&
        !wasUnavailable &&
        sessionMeta.value.isAuthenticated
      ) {
        navigate({ name: ROUTE.BASKET_UNAVAILABLE });
      }

      wasUnavailable = isUnavailable;
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
        if (!routingMeta.value.isResolved) return;

        if (
          !isUnavailable &&
          !hasProducts &&
          hadProducts &&
          !isCheckout &&
          !isComplete
        ) {
          navigate({ name: ROUTE.BASKET_EMPTY });
        }

        hadProducts = hasProducts;
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
