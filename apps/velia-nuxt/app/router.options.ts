// -----------------------------------------------------------------------------
/**
 * @module router/options
 * @description Velia's route config: cart-nuxt's routes with the basket served under `/order/cart`.
 * Nuxt keeps one `routes` hook across layers, so this one calls cart-nuxt's.
 */
import cartRouterOptions from "../../cart-nuxt/app/router.options";
import { BASKET_SEGMENT, DEFAULT_BASKET_SEGMENT } from "./funnels/segment";
import { assign, map, replace, startsWith } from "lodash-es";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

const DEFAULT_BASKET_PREFIX = `/order/${DEFAULT_BASKET_SEGMENT}`;

const BASKET_PREFIX = `/order/${BASKET_SEGMENT}`;

const DEFAULT_SEGMENT_PARAM = `:segment(${DEFAULT_BASKET_SEGMENT})`;

const SEGMENT_PARAM = `:segment(${DEFAULT_BASKET_SEGMENT}|${BASKET_SEGMENT})`;

function toVeliaPath(path: string): string {
  if (startsWith(path, DEFAULT_BASKET_PREFIX)) {
    return replace(path, DEFAULT_BASKET_PREFIX, BASKET_PREFIX);
  }

  return replace(path, DEFAULT_SEGMENT_PARAM, SEGMENT_PARAM);
}

function toVeliaRoute(route: RouteRecordRaw): RouteRecordRaw {
  return assign({}, route, { path: toVeliaPath(route.path) });
}

export default {
  routes: (routes: RouteRecordRaw[]): RouteRecordRaw[] =>
    map(cartRouterOptions.routes(routes), toVeliaRoute)
};
