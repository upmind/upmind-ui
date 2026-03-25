// --- external
import { createRouter, createWebHistory } from "vue-router";

// --- internal
import routes from "./routes";
import { registerOverlayRoutes } from "@upmind-automation/headless";
import { useAssetRecovery } from "@upmind-automation/client-vue";

// ---types
export * from "./types";

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
  scrollBehavior(to, _from, _savedPosition) {
    // handle scroll to anchor on same page
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 108
      };
    } else {
      // always scroll to top
      return { behavior: "smooth", top: 0 };
    }
  }
});

// Register overlay routes before initial navigation so deep-linked URLs resolve
registerOverlayRoutes(router);

// --- clear retry flag on successful navigation
router.afterEach(() => {
  useAssetRecovery().clear();
});

export default router;
