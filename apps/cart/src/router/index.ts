// --- external
import { createRouter, createWebHistory } from "vue-router";
// --- internal
import routes from "./routes";
import { clearChunkRetryFlag, registerChunkErrorRecovery } from "./utils";
// ---types
export * from "./types";

// -----------------------------------------------------------------------------

// --- chunk error recovery
registerChunkErrorRecovery();

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

// --- clear retry flag on successful navigation
router.afterEach(() => {
  clearChunkRetryFlag();
});

export default router;
