// -----------------------------------------------------------------------------
/**
 * @module router/options
 * @description cart-nuxt's route config. Holds the BID-aware route definitions +
 * overlay registry, and replaces Nuxt's auto-generated paths with BID_PREFIX
 * versions via the `routes()` hook.
 *
 * Nuxt's file-system routing generates routes without the optional
 * `:segment(basket)?/:bid(UUID)?` segments, so we filter the scanned routes we
 * own and push BID-aware replacements (same names so `router.resolve` works).
 *
 * @see apps/cart/src/router/routes.ts — the legacy SPA route table this mirrors.
 */
import {
  OverlayType,
  SESSION_FORMS,
  useAssetRecovery
} from "@upmind-automation/client-vue";
import { BID_PREFIX, RegexMatch, ROUTE } from "./funnels/types";
import { filter, flatMap, map, reduce } from "lodash-es";
import type {
  RouteLocationNormalized,
  RouteRecordRaw,
  RouterScrollBehavior
} from "vue-router";

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
    path: "/verify-email/",
    name: ROUTE.OVERLAY_VERIFY_EMAIL,
    component: () => import("~/pages/overlays/AccountOverlay.vue"),
    meta: {
      overlay: OverlayType.CUSTOM,
      dismissable: false,
      mode: SESSION_FORMS.VERIFY
    }
  }
];

/**
 * Overlay registry — maps the relative path suffix to its route name for
 * registerOverlayRoutes(). The leading slash is stripped so overlays register
 * as RELATIVE children (inheriting the parent's bid/segment params) rather than
 * absolute paths, which Vue Router rejects on param-bearing parents.
 * Consumed by the funnels engine + the upmind plugin.
 */
export const CART_OVERLAYS: Record<string, string> = reduce(
  OVERLAY_ROUTES,
  (acc, route) => ({
    ...acc,
    [route.path.replace(/^\//, "")]: route.name as string
  }),
  {}
);

const BID_ROUTES: RouteRecordRaw[] = [
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
];

/**
 * Route names replaced with BID-aware versions — derived from BID_ROUTES (incl.
 * children) so the two never drift. Filtered OUT of Nuxt's scanned routes.
 */
const REPLACED_ROUTE_NAMES = new Set<string>(
  flatMap(BID_ROUTES, route => [
    route.name,
    ...map(route.children ?? [], "name")
  ]) as string[]
);

// -----------------------------------------------------------------------------

export default {
  // Defer scroll restoration until the incoming page has actually mounted
  // (Suspense commit) — otherwise Nuxt's default fires mid-navigation and
  // scrolls the still-visible outgoing page to the new page's position.

  scrollBehavior(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    savedPosition: Parameters<RouterScrollBehavior>[2]
  ) {
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

  routes: (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
    // Remove scanned routes that we are replacing (including nested children)
    const filtered = filter(routes, route => {
      if (REPLACED_ROUTE_NAMES.has(String(route.name))) return false;
      // Also filter children recursively
      if (route.children) {
        route.children = filter(
          route.children,
          child => !REPLACED_ROUTE_NAMES.has(String(child.name))
        );
      }
      return true;
    });

    // Push BID-aware routes (same names so router.resolve works) + overlays
    filtered.push(...BID_ROUTES, ...OVERLAY_ROUTES);

    return filtered;
  }
};
