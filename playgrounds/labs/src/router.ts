// --- external
import { createRouter, createWebHistory, type Router } from "vue-router";

// --- internal
import Home from "./pages/index.vue";
import { get } from "lodash-es";
import { ROUTE } from "./funnels";
import { useSession } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------
// Dynamic Routes from pages - self registering

const importedRoutes = import.meta.glob<Object>("@/pages/**/routes.ts", {
  import: "default",
  eager: true
});

const dynamicRoutes: any[] = [];

for (const modules in importedRoutes) {
  const moduleRoutes = get(importedRoutes[modules], "routes", []);
  dynamicRoutes.push(...moduleRoutes);
}

// -----------------------------------------------------------------------------

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Home/Index Route
    {
      path: "/",
      name: ROUTE.HOME,
      component: Home
    },

    // --- Dynamic Routes (self-registering from pages)
    ...dynamicRoutes,

    // --- Fallback Route
    {
      path: "/:pathMatch(.*)*",
      name: ROUTE.NOT_FOUND,
      component: () => import("./pages/index.vue"),
      meta: {
        title: "Page Not Found"
      }
    }
  ],
  scrollBehavior(to, _from, _savedPosition) {
    // handle scroll to anchor on the same page
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 108
      };
    } else {
      // always scroll to the top
      return { behavior: "smooth", top: 0 };
    }
  }
});

// -----------------------------------------------------------------------------
// --- auth guard

router.beforeEach(async to => {
  if (!to.meta.needsAuth) return;

  const { meta: sessionMeta, isReady } = useSession();

  await isReady();

  if (!sessionMeta.value.isAuthenticated) {
    return {
      name: ROUTE.SESSION_LOGIN,
      query: { returnUrl: to.fullPath }
    };
  }
});

// -----------------------------------------------------------------------------

export default router;
