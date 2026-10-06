import cartRedirects from "../../cart-nuxt/app/middleware/redirects.global";
import { BASKET_SEGMENT, DEFAULT_BASKET_SEGMENT } from "./funnels/segment";
import { replace, startsWith } from "lodash-es";

const BASKET_PATH = `/order/${BASKET_SEGMENT}/`;

const DEFAULT_BASKET_PATH = `/order/${DEFAULT_BASKET_SEGMENT}/`;

export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path === BASKET_PATH) return;

  // Here, not a route-record redirect: one of those skips the routing guard on first load.
  if (startsWith(to.path, DEFAULT_BASKET_PATH)) {
    return navigateTo(
      {
        path: replace(to.path, DEFAULT_BASKET_PATH, BASKET_PATH),
        query: to.query,
        hash: to.hash
      },
      { redirectCode: 301 }
    );
  }

  return cartRedirects(to, from);
});
