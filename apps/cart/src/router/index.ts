// --- external
import { createRouter, createWebHistory } from "vue-router";

// --- internal
import routes from "./routes";

// ---types
export * from "./types";

// -----------------------------------------------------------------------------

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
