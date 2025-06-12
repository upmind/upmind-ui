// --- external
import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  type Router,
} from "vue-router";

// --- internal

import {
  UpmLoadingView,
  Upm404View,
  UpmBasketView,
  UpmCheckoutView,
  UpmOrderView,
  UpmSessionRegisterView,
  UpmSessionLoginView,
  UpmSessionLogoutView,
  UpmSessionRecoverPasswordView,
  UpmProductAddView,
  UpmProductEditView,
  UpmProductRecommendationsView,
  UpmRecommendationsView,
  UpmProductNotFoundView,
  UpmProductRequiresActionView,
  UpmEmptyView,
  ROUTE,
} from "@upmind-automation/client-vue";
import { get } from "lodash-es";

import Home from "../views/index.vue";

// -----------------------------------------------------
// Dynamic Routes

const importedRoutes = import.meta.glob<Object>("@/views/**/routes.ts", {
  import: "default",
  eager: true,
});

const dynamicRoutes: RouteRecordRaw[] = [];

for (const modules in importedRoutes) {
  const moduleRoutes = get(importedRoutes[modules], "routes", []);

  // No Promises since it's eager loaded.
  dynamicRoutes.push(...moduleRoutes);
}

// -----------------------------------------------------

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Static Routes
    {
      path: "/",
      component: Home,
    },

    {
      path: "/loading",
      name: ROUTE.LOADING,
      component: () => UpmLoadingView,
    },

    {
      path: "/empty",
      name: ROUTE.EMPTY,
      component: () => UpmEmptyView,
    },
    {
      path: "/basket",
      name: ROUTE.BASKET,
      alias: ["/cart"],
      component: () => UpmBasketView,
    },
    {
      path: "/checkout",
      name: ROUTE.CHECKOUT,
      component: () => UpmCheckoutView,
    },
    {
      path: "/order/:orderId",
      name: ROUTE.ORDER,
      alias: ["/orders/:orderId"],
      component: () => UpmOrderView,
    },
    {
      path: "/recommendations",
      name: ROUTE.RECOMMENDATIONS,
      component: () => UpmRecommendationsView,
    },
    {
      path: "/auth",
      name: ROUTE.SESSION,
      component: () => UpmSessionRegisterView,
    },
    {
      path: "/auth/login",
      name: ROUTE.SESSION_LOGIN,
      component: () => UpmSessionLoginView,
    },
    {
      path: "/auth/register",
      name: ROUTE.SESSION_REGISTER,
      alias: ["/auth/signup"],
      component: () => UpmSessionRegisterView,
    },
    {
      path: "/auth/recover",
      name: ROUTE.SESSION_RECOVER_PASSWORD,
      component: () => UpmSessionRecoverPasswordView,
    },
    {
      path: "/auth/logout",
      alias: ["/auth/signout"],
      name: ROUTE.SESSION_END,
      component: () => UpmSessionLogoutView,
    },
    {
      path: "/express/product/add/:pid",
      name: ROUTE.EXPRESS_PRODUCT_ADD,
      component: () => UpmProductAddView,
    },
    {
      path: "/product/add/:pid",
      name: ROUTE.PRODUCT_ADD,
      component: () => UpmProductAddView,
    },
    {
      path: "/product/recommendations/:pid",
      name: ROUTE.PRODUCT_RECOMMENDATIONS,
      component: () => UpmProductRecommendationsView,
    },
    {
      path: "/product/edit/:bpid",
      name: ROUTE.PRODUCT_EDIT,
      component: () => UpmProductEditView,
    },
    {
      path: "/product/not-found/",
      name: ROUTE.PRODUCT_NOT_FOUND,
      component: () => UpmProductNotFoundView,
    },
    {
      path: "/product/requires-action/",
      name: ROUTE.PRODUCT_REQUIRES_ACTION,
      component: () => UpmProductRequiresActionView,
    },

    // --- Dynamic Routes
    ...dynamicRoutes,

    // --- Fallback Route
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => Upm404View,
      meta: {
        title: "Page Not Found",
      },
    },
  ],
  scrollBehavior(to, _from, _savedPosition) {
    // handle scroll to anchor on the same page
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 108,
      };
    } else {
      // always scroll to the top
      return { behavior: "smooth", top: 0 };
    }
  },
});

// -----------------------------------------------------

export default router;
