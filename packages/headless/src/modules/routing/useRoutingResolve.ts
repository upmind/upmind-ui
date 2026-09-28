import { computed, toValue } from "vue";
import { useRouter } from "vue-router";
import { useRoutingEngine } from "./useRoutingEngine";
import type { RoutingResolveOptions } from "./routing.types";

// -----------------------------------------------------------------------------

/**
 * Takes the funnel step when the host drives funnels, else the given route.
 * Call it before the view's first `await`.
 */
export function useRoutingResolve(options: RoutingResolveOptions = {}) {
  const router = useRouter();
  const { navigateNext, navigateBack, meta: routingMeta } = useRoutingEngine();

  const meta = computed(() => ({
    hasResolve: routingMeta.value.hasFunnels || !!toValue(options.resolveRoute),
    hasReject: routingMeta.value.hasFunnels || !!toValue(options.rejectRoute)
  }));

  function navigateResolved() {
    if (routingMeta.value.hasFunnels) return navigateNext();

    const landing = toValue(options.resolveRoute);
    if (!landing) return Promise.resolve();

    return router.push(landing);
  }

  function navigateRejected() {
    if (routingMeta.value.hasFunnels) return navigateBack();

    const reject = toValue(options.rejectRoute);
    if (!reject) return Promise.resolve();

    return router.push(reject);
  }

  return { meta, navigateResolved, navigateRejected };
}
