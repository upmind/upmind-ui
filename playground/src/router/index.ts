// --- external
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw
} from "vue-router";

// --- internal
import HomeView from "@/views/HomeView.vue";

// --- utils
import { get } from "lodash-es";

// -----------------------------------------------------
// Dynamic Routes

const importedRoutes = import.meta.glob<Object>("@/modules/**/routes/*.ts", {
  import: "default",
  eager: true
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
      component: HomeView
    },
    {
      path: "/about",
      name: "about",
      component: () => import("@/views/AboutView.vue")
    },
    // ---
    ...routes
  ]
});

// -----------------------------------------------------

export default router;
