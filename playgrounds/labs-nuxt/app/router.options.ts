import { map } from "lodash-es";
import type { RouterConfig } from "@nuxt/schema";
// -----------------------------------------------------------------------------
/**
 * @module router.options
 * @description Custom router configuration for optional brand-prefix routing.
 *
 * Adds an optional `:brandIdOrOrg?` parameter prefix to all page routes.
 * This enables brand-scoped URLs like `/my-brand/useInvoices` alongside `/useInvoices`.
 *
 * Vue-router 4 route ranking ensures static segments (e.g., `/useInvoices`) are
 * preferred over dynamic parameters, so `/useInvoices` correctly matches the
 * useInvoices route rather than being consumed as a brand ID.
 *
 * Examples:
 * - `/`                          → home (no brand)
 * - `/my-brand`                  → home (brand = "my-brand")
 * - `/useInvoices`                   → useInvoices (no brand)
 * - `/my-brand/useInvoices`          → useInvoices (brand = "my-brand")
 * - `/useInvoices/as/client`         → useInvoices with scope (no brand)
 * - `/my-brand/useInvoices/as/client` → useInvoices with scope and brand
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
