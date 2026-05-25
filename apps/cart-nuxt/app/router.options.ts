// -----------------------------------------------------------------------------
/**
 * @module router/options
 * @description Replaces Nuxt's auto-generated route paths with BID_PREFIX paths.
 *
 * Nuxt's file-system routing generates routes without the optional
 * `:segment(basket)?/:bid(UUID)?` segments. This file replaces matching
 * routes with new definitions that include the BID path pattern, reusing
 * each page's component via direct import.
 *
 * @see apps/cart/src/router/routes.ts — source of truth for route paths
 */
import { BID_PREFIX, RegexMatch, ROUTE } from "./funnels/types";
import { useAssetRecovery, OverlayType } from "@upmind-automation/client-vue";
import { reduce } from "lodash-es";

// --- types
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

// Register the asset recovery handler early so it catches chunk errors
// during the first route resolution. When a lazy chunk fails to preload
// (e.g. after a deploy with new hashed filenames), the handler fires a
// system interstitial via useFeedback prompting the user to reload.
if (import.meta.client) {
  useAssetRecovery().register();
}

// -----------------------------------------------------------------------------

const UUID = RegexMatch.UUID;

/**
 * Overlay route definitions — components rendered inside OverlayController.
 */
const OVERLAY_ROUTES: RouteRecordRaw[] = [
  {
    path: "/auth/",
    name: ROUTE.OVERLAY_AUTH,
    component: () => import("~/pages/overlays/AuthOverlay.vue"),
    meta: { overlay: OverlayType.MODAL }
  },
  {
    path: "/2fa/",
    name: ROUTE.OVERLAY_2FA,
    component: () => import("~/pages/overlays/AuthOverlay.vue"),
    meta: { overlay: OverlayType.MODAL }
  },
  {
    path: "/verify-email/",
    name: ROUTE.OVERLAY_VERIFY_EMAIL,
    component: () => import("~/pages/overlays/AuthOverlay.vue"),
    meta: { overlay: OverlayType.MODAL }
  }
];

/**
 * Overlay registry — maps relative path suffix to route name.
 * Used by registerOverlayRoutes() to inject child routes.
 */
const CART_OVERLAYS: Record<string, string> = reduce(
  OVERLAY_ROUTES,
  (acc, route) => ({
    ...acc,
    [route.path.replace(/^\//, "")]: route.name as string
  }),
  {}
);

/**
 * Set of route names that we are replacing with BID-aware versions.
 * These will be filtered OUT of the scanned routes.
 */
const REPLACED_ROUTE_NAMES = new Set([
  "catalogue",
  "checkout",
  "recommendations",
  "session",
  "session-login",
  "session-register",
  "session-end",
  "session-recover",
  "session-transfer",
  "product",
  "product-configure",
  "product-not-found",
  "product-recommendations",
  "domains",
  "domains-product",
  "domains-product-processing"
]);

// -----------------------------------------------------------------------------

export default {
  // Defer scroll restoration until the incoming page has actually mounted
  // (Suspense commit) — otherwise Nuxt's default fires mid-navigation and
  // scrolls the still-visible outgoing page to the new page's position.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollBehavior(to: any, from: any, savedPosition: any) {
    return new Promise(resolve => {
      const nuxt = useNuxtApp();
      nuxt.hooks.hookOnce("page:finish", () => {
        if (savedPosition) return resolve(savedPosition);
        if (to.hash) return resolve({ el: to.hash });
        // preserve scroll on same-page transitions (e.g. in-situ basket adds,
        // filter/category changes) — only scroll to top on actual page changes
        if (to.name === from?.name) return resolve(false);
        resolve({ top: 0, behavior: "instant" });
      });
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routes: (_routes: any[]) => {
    // Remove scanned routes that we are replacing (including nested children)
    const filtered = _routes.filter((route: any) => {
      if (REPLACED_ROUTE_NAMES.has(route.name)) return false;
      // Also filter children recursively
      if (route.children) {
        route.children = route.children.filter(
          (child: any) => !REPLACED_ROUTE_NAMES.has(child.name)
        );
      }
      return true;
    });

    // Push BID-aware routes with the SAME names (so router.resolve works)
    filtered.push(
      // --- shop / catalogue
      {
        name: ROUTE.CATALOGUE,
        path: `/order/${BID_PREFIX}/shop/`,
        component: () => import("~/pages/order/shop.vue")
      },
      {
        name: ROUTE.CHECKOUT,
        path: `/order/${BID_PREFIX}/checkout/`,
        component: () => import("~/pages/order/checkout.vue")
      },
      {
        name: ROUTE.RECOMMENDATIONS,
        path: `/order/${BID_PREFIX}/recommendations/`,
        component: () => import("~/pages/order/recommendations.vue")
      },

      // --- domains
      {
        name: ROUTE.DOMAINS,
        path: `/order/${BID_PREFIX}/domains/`,
        component: () => import("~/pages/order/domains/index.vue")
      },
      {
        name: ROUTE.DOMAINS_WITH_PRODUCT,
        path: `/order/${BID_PREFIX}/domains/:pid(${UUID})/`,
        component: () => import("~/pages/order/domains/[pid]/index.vue")
      },
      {
        name: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING,
        path: `/order/${BID_PREFIX}/domains/:pid(${UUID})/processing/`,
        component: () => import("~/pages/order/domains/[pid]/processing.vue")
      },

      // --- auth (parent + children, mirrors cart's nested structure)
      {
        name: ROUTE.SESSION,
        path: `/order/${BID_PREFIX}/auth/`,
        component: () => import("~/pages/order/auth/index.vue"),
        children: [
          {
            name: ROUTE.SESSION_LOGIN,
            path: "login/",
            component: () => import("~/pages/order/auth/login.vue")
          },
          {
            name: ROUTE.SESSION_REGISTER,
            path: "register/",
            alias: ["signup/"],
            component: () => import("~/pages/order/auth/register.vue")
          },
          {
            name: ROUTE.SESSION_END,
            path: "logout/",
            alias: ["signout/"],
            component: () => import("~/pages/order/auth/end.vue")
          },
          {
            name: ROUTE.SESSION_RECOVER_PASSWORD,
            path: "recover/",
            component: () => import("~/pages/order/auth/recover.vue")
          },
          {
            name: ROUTE.SESSION_TRANSFER,
            path: "transfer/",
            component: () => import("~/pages/order/auth/transfer.vue")
          }
        ]
      },

      // --- product (parent + children, mirrors cart's nested structure)
      {
        name: ROUTE.PRODUCT,
        path: `/order/${BID_PREFIX}/product/`,
        component: () => import("~/pages/order/product/index.vue"),
        children: [
          {
            name: ROUTE.PRODUCT_CONFIGURE,
            path: `:pid(${UUID})/`,
            component: () => import("~/pages/order/product/[pid].vue")
          },
          {
            name: ROUTE.PRODUCT_NOT_FOUND,
            path: `:pid(${UUID})/not-found/`,
            component: () => import("~/pages/order/product/not-found.vue")
          },
          {
            name: ROUTE.PRODUCT_RECOMMENDATIONS,
            path: `:pid(${UUID})/recommendations/`,
            component: () => import("~/pages/order/product/recommendations.vue")
          }
        ]
      }
    );

    // Add overlay routes (components for OverlayController to resolve)
    filtered.push(...OVERLAY_ROUTES);

    return filtered;
  }
};

// Export overlay registry for use in plugins
export { CART_OVERLAYS };
