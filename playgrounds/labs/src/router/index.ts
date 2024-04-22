// --- external
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

// --- internal
import HomeView from "@/views/Index.vue";

// --- utils
import { get } from "lodash-es";

// -----------------------------------------------------
// Dynamic Routes

const importedRoutes = import.meta.glob<Object>("@/modules/**/routes/*.ts", {
  import: "default",
  eager: true,
});

const routes: RouteRecordRaw[] = [];

for (const modules in importedRoutes) {
  const moduleRoutes = get(importedRoutes[modules], "routes", []);

  // No Promises since it's eager loaded.
  routes.push(...moduleRoutes);
}

// -----------------------------------------------------

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    // ---
    ...routes,
  ],
  scrollBehavior(to, _from, _savedPosition) {
    // handle scroll to anchor on same page
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 108,
      };
    }
  },
});

// -----------------------------------------------------

export default router;
