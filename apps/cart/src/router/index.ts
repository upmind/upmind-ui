// --- external
import { createRouter, createWebHistory } from "vue-router";
// --- internal
import routes from "./routes";
import { registerOverlayRoutes } from "@upmind-automation/headless";
// ---types
export * from "./types";

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

export default router;
