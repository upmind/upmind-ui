import { map } from "lodash-es";
import type { RouterConfig } from "@nuxt/schema";
// -----------------------------------------------------------------------------
/**
 * @module router.options
 * @description Custom router configuration for optional brand-prefix routing.
 *
 * Adds an optional `:brandIdOrOrg?` parameter prefix to all page routes.
 * This enables brand-scoped URLs like `/my-brand/useAuth` alongside `/useAuth`.
 *
 * Vue-router 4 route ranking ensures static segments (e.g., `/useAuth`) are
 * preferred over dynamic parameters, so `/useAuth` correctly matches the
 * useAuth route rather than being consumed as a brand ID.
 *
 * Examples:
 * - `/`                          → home (no brand)
 * - `/my-brand`                  → home (brand = "my-brand")
 * - `/useAuth`                   → useAuth (no brand)
 * - `/my-brand/useAuth`          → useAuth (brand = "my-brand")
 * - `/useAuth/as/client`         → useAuth with scope (no brand)
 * - `/my-brand/useAuth/as/client` → useAuth with scope and brand
 */

export default <RouterConfig>{
  routes: _routes => {
    return map(_routes, route => ({
      ...route,
      path:
        route.path === "/" ? "/:brandIdOrOrg?" : `/:brandIdOrOrg?${route.path}`
    }));
  }
};
