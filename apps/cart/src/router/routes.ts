// --- internal
import { useBrand } from "@upmind-automation/client-vue";
import { ROUTE, RegexMatch } from "./types";
// --- utils
import { trimStart } from "lodash-es";
// --- types
import type { RouteLocationGeneric, RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

/**
 * Optional basket ID path prefix used by most routes.
 * When both params are provided (`segment: 'basket'`, `bid: '<uuid>'`),
 * routes render as `/order/basket/{bid}/...`.
 * When omitted, routes render as `/order/...` (current basket).
 */
const BID_PREFIX = `:segment(basket)?/:bid(${RegexMatch.UUID})?`;

export default [
  /**
   * Catch-all route for handling not found pages within the /order context.
   * If the path simply lacks a trailing slash, redirect to the slashed version
   * (avoids a 404 flash caused by `strict: true` in the router config).
   * Otherwise renders a generic error (404) page component.
   */
  {
    path: "/order/:pathMatch(.*)*",
    name: ROUTE.NOT_FOUND,
    component: () => import("../pages/Error.vue"),
    meta: {},
    beforeEnter: to => {
      if (!to.path.endsWith("/")) {
        return { path: `${to.path}/`, query: to.query, hash: to.hash };
      }
    }
  },

  /**
   * Single catch-all redirect for any route not starting with /order.
   * Ensures legacy routes are redirected to the new /order structure.
   */
  {
    path: "/:legacy(.*)",
    redirect: (to: RouteLocationGeneric) => {
      if (to.path !== "/" && !to.path.startsWith("/order/")) {
        return {
          path: `/order/${trimStart(to.path, "/")}`,
          query: to.query,
          hash: to.hash
        };
      }
      return to.fullPath;
    }
  },

  // ---------------------------------------------------------------------------

  /**
   * Route for the loading state of the application.
   * This is typically the default route when the application is initializing.
   * It may display a loading indicator while data is being fetched or processed.
   */
  {
    path: "/",
    name: ROUTE.LOADING,
    alias: ["/order/", "/loading/"],
    component: () => import("../pages/Index.vue"),
    meta: { replace: true }
  },

  /**
   * Route for the shopping basket/cart page.
   * Displays the contents of the user's shopping basket.
   * This route is typically accessed when the user wants to review
   * or modify the items they intend to purchase.
   */
  {
    path: `/order/basket/:bid(${RegexMatch.UUID})?/`,
    name: ROUTE.BASKET,
    component: () => import("../pages/Basket.vue"),
    meta: {
      actionEmptyBasket: true
    }
  },

  /**
   * Redirect from /order/cart to /order/basket for legacy support.
   * Preserves path segments and query params.
   */
  {
    path: "/order/cart/:pathMatch(.*)*",
    redirect: to => ({
      path: `/order/basket/${(to.params.pathMatch as string[])?.join("/") || ""}`,
      query: to.query
    })
  },

  /**
   * Route for an empty shopping basket.
   * Typically displayed when the user has not added any products to their basket.
   * This route provides a user-friendly message indicating that the basket is empty
   * and may include suggestions or links to continue shopping.
   */
  {
    path: `/order/basket/:bid(${RegexMatch.UUID})?/empty/`,
    name: ROUTE.BASKET_EMPTY,
    component: () => import("../pages/Empty.vue")
  },

  /**
   * Route displayed when a basket is unavailable or invalid.
   */
  {
    path: `/order/basket/unavailable/`,
    name: ROUTE.BASKET_UNAVAILABLE,
    component: () => import("../pages/BasketUnavailable.vue")
  },

  /**
   * Route for editing a product already in the basket.
   * The :bpid parameter captures the unique basket product identifier (UUID format).
   * This route typically leads to a page where users can modify product options
   * or configurations for the selected basket item.
   */
  {
    path: `/order/basket/:bid(${RegexMatch.UUID})?/edit/:bpid(${RegexMatch.UUID})/`,
    name: ROUTE.BASKET_PRODUCT_EDIT,
    component: () => import("../pages/product/Edit.vue")
  },

  /**
   * Legacy redirect from /order/product/edit/:bpid to /order/basket/:bpid.
   * Ensures that any old links or bookmarks pointing to the previous edit route
   * are redirected to the current basket product edit route.
   */
  {
    path: `/order/product/edit/:bpid(${RegexMatch.UUID})/`,
    redirect: (to: RouteLocationGeneric) => {
      // 'to' is the target route location object, which includes the original query
      return {
        name: ROUTE.BASKET_PRODUCT_EDIT,
        params: { bpid: to.params.bpid }, // Persist the cart product ID parameter
        query: to.query // Persist all original query parameters
      };
    }
  },

  /**
   * Route for handling products in the basket that require additional user action.
   * The :bpid parameter captures the unique basket product identifier (UUID format).
   * This route typically leads to a page where users can resolve issues
   * such as selecting options or configurations for the product.
   */
  {
    path: `/order/basket/:bid(${RegexMatch.UUID})?/requires-action/:bpid(${RegexMatch.UUID})?/`,
    name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION,
    component: () => import("../pages/product/RequiresAction.vue")
  },

  /**
   * NOTE: No catch-all redirect here for /order/basket/:pathMatch(.*)*
   * because it would intercept BID_PREFIX routes that render as
   * /order/basket/{bid}/shop, /order/basket/{bid}/checkout, etc.
   * Unknown basket URLs fall through to the NOT_FOUND catch-all above.
   */
  /**
   * Route for the checkout process.
   * Displays the checkout page where users can finalize their orders.
   * This route is typically accessed after reviewing the basket contents.
   */
  {
    path: `/order/${BID_PREFIX}/checkout/`,
    name: ROUTE.CHECKOUT,
    component: () => import("../pages/Checkout.vue"),
    meta: {
      actionEmptyBasket: true
    }
  },

  /**
   * Route for managing billing details on a standalone page.
   * Accessed from the checkout billing summary "Change" link.
   */
  {
    path: "/order/billing/",
    name: ROUTE.BILLING,
    component: () => import("../pages/Billing.vue"),
    meta: {
      actionEmptyBasket: true
    }
  },

  /**
   * Route for editing domain registrant details.
   * Displayed after billing when basket contains domain products.
   */
  {
    path: "/order/registrant/",
    name: ROUTE.REGISTRANT,
    component: () => import("../pages/Registrant.vue"),
    meta: {
      actionEmptyBasket: true
    }
  },

  /**
   * Route for reviewing domain registrant details before checkout.
   * Shows all domain registrant statuses with completeness tracking.
   */
  {
    path: "/order/registrant/review/",
    name: ROUTE.REGISTRANT_REVIEW,
    component: () => import("../pages/RegistrantReview.vue"),
    meta: {
      actionEmptyBasket: true
    }
  },

  /**
   * Route for viewing a completed order.
   * The :oid parameter captures the unique order identifier (UUID format).
   */
  {
    path: `/order/:oid(${RegexMatch.UUID})/`,
    name: ROUTE.ORDER,
    component: () => import("../pages/Order.vue")
  },

  /**
   * Redirect from /orders/:oid to /order/:oid for legacy support.
   */
  {
    path: `/orders/:oid(${RegexMatch.UUID})/`,
    redirect: (to: RouteLocationGeneric) => {
      // 'to' is the target route location object, which includes the original query
      return {
        name: ROUTE.ORDER,
        params: { oid: to.params.oid }, // Persist the order ID parameter
        query: to.query // Persist all original query parameters
      };
    }
  },

  /**
   * Route that redirects to the storefront, either external or internal based on brand settings.
   * If an external storefront URL is configured, the browser will navigate to that URL.
   * Otherwise, it redirects to the internal catalogue or basket route.
   */
  /**
   * Route for the product catalogue page within the order context.
   * Displays the list of products available for browsing and selection.
   * Users can also filter/navigate products by categories from this page.
   */
  {
    path: `/order/${BID_PREFIX}/shop/`,
    name: ROUTE.CATALOGUE,
    component: () => import("../pages/Catalogue.vue")
  },

  /**
   * Redirect from /order/products to /order/shop for consistency.
   */
  {
    path: "/order/products/",
    redirect: { name: ROUTE.CATALOGUE }
  },

  /**
   * Route for product recommendations within the order context.
   * Displays personalized product suggestions based on user behavior and preferences.
   * This is based on ALL products in the basket, not just a single product.
   */
  {
    path: `/order/${BID_PREFIX}/recommendations/`,
    name: ROUTE.RECOMMENDATIONS,
    component: () => import("../pages/Recommendations.vue")
  },

  /**
   * Route for domain management within the order context.
   * Displays the domain search and registration interface.
   * Users can search for, register, and manage domains from this page.
   */
  {
    path: `/order/${BID_PREFIX}/domains/`,
    name: ROUTE.DOMAINS,
    component: () => import("../pages/Domains.vue")
  },

  {
    path: `/order/${BID_PREFIX}/domains/:pid(${RegexMatch.UUID})/`,
    name: ROUTE.DOMAINS_WITH_PRODUCT,
    component: () => import("../pages/Domains.vue")
  },
  {
    path: `/order/${BID_PREFIX}/domains/:pid(${RegexMatch.UUID})/processing/`,
    name: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING,
    component: () => import("../pages/Index.vue")
  },

  /**
   * Routes for session management including login, registration, logout, and password recovery.
   * These routes are nested under /order/auth for better organization.
   */
  {
    path: `/order/${BID_PREFIX}/auth/`,
    name: ROUTE.SESSION,
    component: () => import("../pages/session/Index.vue"),
    children: [
      {
        path: "login/",
        name: ROUTE.SESSION_LOGIN,
        component: () => import("../pages/session/Login.vue")
      },
      {
        path: "register/",
        name: ROUTE.SESSION_REGISTER,
        alias: ["signup/"],
        component: () => import("../pages/session/Register.vue")
      },
      {
        path: "logout/",
        name: ROUTE.SESSION_END,
        alias: ["signout/"],
        component: () => import("../pages/session/End.vue")
      },
      {
        path: "recover/",
        name: ROUTE.SESSION_RECOVER_PASSWORD,
        component: () => import("../pages/session/Recover.vue")
      }
    ]
  },

  /**
   * Routes for individual product operations within the order context.
   * Includes product configuration, handling not found products,
   * and viewing individual product recommendations.
   * These routes are nested under /order/product for better organization.
   */
  {
    path: `/order/${BID_PREFIX}/product/`,
    name: ROUTE.PRODUCT,
    component: () => import("../pages/product/Index.vue"),
    children: [
      {
        path: `:pid(${RegexMatch.UUID})/`,
        name: ROUTE.PRODUCT_CONFIGURE,
        component: () => import("../pages/product/Configure.vue")
      },
      {
        path: `:pid(${RegexMatch.UUID})/not-found/`,
        name: ROUTE.PRODUCT_NOT_FOUND,
        component: () => import("../pages/product/NotFound.vue")
      },
      {
        path: `:pid(${RegexMatch.UUID})/recommendations/`,
        name: ROUTE.PRODUCT_RECOMMENDATIONS,
        component: () => import("../pages/product/Recommendations.vue")
      }
    ]
  },

  {
    path: `/order/product/add/:pid(${RegexMatch.UUID})/`,
    redirect: (to: RouteLocationGeneric) => {
      // 'to' is the target route location object, which includes the original query
      return {
        name: ROUTE.PRODUCT_CONFIGURE,
        params: { pid: to.params.pid }, // Persist the product ID parameter
        query: to.query // Persist all original query parameters
      };
    }
  }
] as RouteRecordRaw[];
