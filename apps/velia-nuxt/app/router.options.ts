// -----------------------------------------------------------------------------
/**
 * @module router/options
 * @description Velia's route config: cart-nuxt's routes plus velia's legacy basket redirect.
 * Nuxt keeps one `routes` hook across layers, so this one calls cart-nuxt's.
 */
import cartRouterOptions from "../../cart-nuxt/app/router.options";
import { concat } from "lodash-es";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

export default {
  routes: (routes: RouteRecordRaw[]): RouteRecordRaw[] =>
    concat(cartRouterOptions.routes(routes), [
      /**
       * Redirect from /order/cart to /order/basket for legacy support.
       * Preserves path segments and query params.
       */
      {
        path: "/order/basket/:pathMatch(.*)*",
        redirect: to => ({
          path: `/order/cart/${(to.params.pathMatch as string[])?.join("/") || ""}`,
          query: to.query
        })
      }
    ])
};
