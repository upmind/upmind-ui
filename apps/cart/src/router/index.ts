// --- external
import { createRouter, createWebHistory } from "vue-router";

// --- internal

import {
  ROUTE,
  Upm404View,
  UpmBasketView,
  UpmCheckoutView,
  UpmEmptyView,
  UpmLoadingView,
  UpmOrderView,
  UpmProductAddView,
  UpmProductEditView,
  UpmProductNotFoundView,
  UpmProductRecommendationsView,
  UpmProductRequiresActionView,
  UpmRecommendationsView,
  UpmSessionLoginView,
  UpmSessionLogoutView,
  UpmSessionRecoverPasswordView,
  UpmSessionRegisterView,
  UpmShopView
} from "@upmind-automation/client-vue";

// -----------------------------------------------------

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Default route is /order this is our Loading view
    {
      path: "/",
      name: ROUTE.LOADING,
      alias: ["/order", "/loading"],
      component: () => UpmLoadingView
    },

    // All other routes are prefixed with /order
    {
      path: "/order/empty",
      name: ROUTE.EMPTY,
      component: () => UpmEmptyView
    },
    {
      path: "/order/basket",
      name: ROUTE.BASKET,
      alias: ["/order/cart"],
      component: () => UpmBasketView
    },
    {
      path: "/order/checkout",
      name: ROUTE.CHECKOUT,
      component: () => UpmCheckoutView
    },

    {
      path: "/order/:orderId",
      name: ROUTE.ORDER,
      alias: ["/orders/:orderId"],
      component: () => UpmOrderView
    },

    {
      path: "/order/shop",
      name: ROUTE.CATALOGUE,
      component: () => UpmShopView
    },
    {
      path: "/order/product",
      alias: ["/order/products"],
      redirect: { name: ROUTE.CATALOGUE }
    },
    {
      path: "/order/recommendations",
      name: ROUTE.RECOMMENDATIONS,
      component: () => UpmRecommendationsView
    },
    {
      path: "/order/auth",
      name: ROUTE.SESSION,
      component: () => UpmSessionRegisterView
    },
    {
      path: "/order/auth/login",
      name: ROUTE.SESSION_LOGIN,
      component: () => UpmSessionLoginView
    },
    {
      path: "/order/auth/register",
      name: ROUTE.SESSION_REGISTER,
      alias: ["/order/auth/signup"],
      component: () => UpmSessionRegisterView
    },
    {
      path: "/order/auth/logout",
      alias: ["/order/auth/signout"],
      name: ROUTE.SESSION_END,
      component: () => UpmSessionLogoutView
    },
    {
      path: "/order/auth/transfer",
      name: ROUTE.SESSION_TRANSFER,
      component: () => UpmLoadingView
    },
    {
      path: "/order/auth/recover",
      name: ROUTE.SESSION_RECOVER_PASSWORD,
      component: () => UpmSessionRecoverPasswordView
    },
    {
      path: "/order/shop/express/add/:pid",
      name: ROUTE.EXPRESS_PRODUCT_ADD,
      component: () => UpmProductAddView
    },
    {
      path: "/order/product/add/:pid",
      name: ROUTE.PRODUCT_ADD,
      component: () => UpmProductAddView
    },
    {
      path: "/order/product/recommendations/:pid",
      name: ROUTE.PRODUCT_RECOMMENDATIONS,
      component: () => UpmProductRecommendationsView
    },
    {
      path: "/order/product/edit/:bpid",
      name: ROUTE.PRODUCT_EDIT,
      component: () => UpmProductEditView
    },
    {
      path: "/order/product/not-found/",
      name: ROUTE.PRODUCT_NOT_FOUND,
      component: () => UpmProductNotFoundView
    },
    {
      path: "/order/product/requires-action/",
      name: ROUTE.PRODUCT_REQUIRES_ACTION,
      component: () => UpmProductRequiresActionView
    },
    {
      path: "/order/:pathMatch(.*)*",
      name: "not-found",
      component: () => Upm404View,
      meta: {
        title: "Page Not Found"
      }
    },

    // Single catch-all redirect for any route not starting with /order
    {
      path: "/:legacy(.*)",
      redirect: to => {
        if (to.path !== "/" && !to.path.startsWith("/order")) {
          return {
            path:
              "/order" + (to.path.startsWith("/") ? to.path : "/" + to.path),
            query: to.query,
            hash: to.hash
          };
        }
        return to.fullPath;
      }
    }
  ],
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

// -----------------------------------------------------

export default router;
