// --- external
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

// --- internal
import Home from "./views/index.vue";

import { Upm404View } from "@upmind-automation/client-vue";

// --- utils
import { get, isFunction } from "lodash-es";

// --- types
import { ROUTE } from "@upmind-automation/client-vue";

// -----------------------------------------------------
// Dynamic Routes

const importedRoutes = import.meta.glob<Object>("./views/**/routes.ts", {
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
      component: Home,
    },
    // ---
    ...routes,
    // ---
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: Upm404View,
      meta: {
        title: "Page Not Found",
      },
    },
  ],
  scrollBehavior(to, _from, _savedPosition) {
    // handle scroll to anchor on same page
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 108,
      };
    } else {
      // always scroll to top
      return { behavior: "smooth", top: 0 };
    }
  },
});

// -----------------------------------------------------

router.beforeEach(async to => {});

// -----------------------------------------------------

export default router;
