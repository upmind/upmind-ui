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
    {
      path: "/",
      name: ROUTE.LOADING,
      alias: ["/loading"],
      component: () => UpmLoadingView
    },

    {
      path: "/empty",
      name: ROUTE.EMPTY,
      component: () => UpmEmptyView
    },
    {
      path: "/basket",
      name: ROUTE.BASKET,
      alias: ["/cart"],
      component: () => UpmBasketView
    },
    {
      path: "/checkout",
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
      path: "/shop",
      name: ROUTE.SHOP,
      component: () => UpmShopView
    },
    {
      path: "/product",
      alias: ["/products", "/order/shop"],
      redirect: { name: ROUTE.SHOP } // Redirect to shop if /product is accessed
    },
    {
      path: "/recommendations",
      name: ROUTE.RECOMMENDATIONS,
      component: () => UpmRecommendationsView
    },
    {
      path: "/auth",
      name: ROUTE.SESSION,
      component: () => UpmSessionRegisterView
    },
    {
      path: "/auth/login",
      name: ROUTE.SESSION_LOGIN,
      component: () => UpmSessionLoginView
    },
    {
      path: "/auth/register",
      name: ROUTE.SESSION_REGISTER,
      alias: ["/auth/signup"],
      component: () => UpmSessionRegisterView
    },
    {
      path: "/auth/logout",
      alias: ["/auth/signout"],
      name: ROUTE.SESSION_END,
      component: () => UpmSessionLogoutView
    },
    {
      path: "/auth/transfer",
      name: ROUTE.SESSION_TRANSFER,
      component: () => UpmLoadingView
    },
    {
      path: "/auth/recover",
      name: ROUTE.SESSION_RECOVER_PASSWORD,
      component: () => UpmSessionRecoverPasswordView
    },
    {
      path: "/express/product/add/:pid",
      name: ROUTE.EXPRESS_PRODUCT_ADD,
      component: () => UpmProductAddView
    },
    {
      path: "/product/add/:pid",
      name: ROUTE.PRODUCT_ADD,
      component: () => UpmProductAddView
    },
    {
      path: "/product/recommendations/:pid",
      name: ROUTE.PRODUCT_RECOMMENDATIONS,
      component: () => UpmProductRecommendationsView
    },
    {
      path: "/product/edit/:bpid",
      name: ROUTE.PRODUCT_EDIT,
      component: () => UpmProductEditView
    },

    {
      path: "/product/not-found/",
      name: ROUTE.PRODUCT_NOT_FOUND,
      component: () => UpmProductNotFoundView
    },
    {
      path: "/product/requires-action/",
      name: ROUTE.PRODUCT_REQUIRES_ACTION,
      component: () => UpmProductRequiresActionView
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => Upm404View,
      meta: {
        title: "Page Not Found"
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
