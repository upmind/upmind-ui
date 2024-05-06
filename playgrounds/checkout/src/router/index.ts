// --- external
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

// --- internal
import CheckoutView from "@/views/checkout/Checkout.vue";

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
      name: "checkout",
      component: CheckoutView,
    },
    {
      path: "/offers",
      name: "offers",
      component: () => import("@/views/offers/Offers.vue"),
    },
    {
      path: "/session",
      name: "session",
      component: () => import("@/views/session/Session.vue"),
    },
    {
      path: "/feedback",
      name: "feedback",
      component: () => import("@/views/feedback/Feedback.vue"),
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
