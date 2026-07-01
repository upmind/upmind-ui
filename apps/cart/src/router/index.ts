import { createRouter, createWebHistory } from "vue-router";
import {
  registerOverlayRoutes,
  useAssetRecovery,
  useRoutingEngine
} from "@upmind-automation/client-vue";
import routes, { CART_OVERLAYS } from "./routes";

// ---types
export * from "./funnels/types";

// -----------------------------------------------------------------------------

// Register the asset recovery handler early so it catches chunk errors
// during the first route resolution. When a lazy chunk fails to preload
// (e.g. after a deploy with new hashed filenames), the handler fires a
// system interstitial via useFeedback prompting the user to reload.
useAssetRecovery().register();

// -----------------------------------------------------------------------------

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  strict: true,
  routes,
  async scrollBehavior(to, from, _savedPosition) {
    const mounted = await useRoutingEngine().isMounted(to);
    // Skip scroll if this call was superseded by a newer navigation.
    if (!mounted) return false;

    if (to.hash) {
      return { el: to.hash, behavior: "smooth", top: 108 };
    }
    // preserve scroll on same-page transitions (e.g. in-situ basket adds,
    // filter/category changes) — only scroll to top on actual page changes
    if (to.name === from?.name) return false;
    return { behavior: "smooth", top: 0 };
  }
});

// Register overlay routes synchronously so deep-linked URLs resolve correctly.
// Must happen before the app mounts (initial navigation).
registerOverlayRoutes(router, CART_OVERLAYS);

// --- clear retry flag on successful navigation
router.afterEach(() => {
  useAssetRecovery().clear();
});

export default router;
