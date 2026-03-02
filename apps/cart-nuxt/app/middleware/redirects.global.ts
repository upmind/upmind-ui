import { trimStart } from "lodash-es";
import { useBrand } from "@upmind-automation/client-vue";
import { ROUTE, RegexMatch } from "~/funnels/types";

/**
 * Global Redirects Middleware
 *
 * Handles URL normalization, legacy redirects, and syntactic sugar routes.
 * Organized into clear sections for maintainability.
 */
export default defineNuxtRouteMiddleware(async to => {
  const rawPath = to.path;

  // ---------------------------------------------------------------------------
  // SECTION 1: SEO OPTIMIZATIONS
  // ---------------------------------------------------------------------------

  // Enforce trailing slashes on all routes for consistent canonical URLs
  if (rawPath !== "/" && !rawPath.endsWith("/")) {
    return navigateTo(
      {
        path: `${rawPath}/`,
        query: to.query,
        hash: to.hash
      },
      { redirectCode: 301 }
    );
  }

  // Normalize path (remove trailing slash) for internal pattern matching
  const path = rawPath === "/" ? "/" : rawPath.replace(/\/$/, "");

  // ---------------------------------------------------------------------------
  // SECTION 2: LEGACY REDIRECTS
  // Redirects from old cart routes to new structure
  // ---------------------------------------------------------------------------

  // --- Path Prefix Migration ---
  // Redirect routes without /order prefix to /order/* structure
  if (path !== "/" && !path.startsWith("/order")) {
    // Exclude system/syntactic routes from prefixing
    const excludedRoutes = [
      "/loading",
      "/error",
      "/unavailable",
      "/not-found",
      "/storefront"
    ];
    if (!excludedRoutes.includes(path)) {
      return navigateTo(
        {
          path: `/order/${trimStart(path, "/")}/`,
          query: to.query,
          hash: to.hash
        },
        { redirectCode: 301 }
      );
    }
  }

  // --- BID Route Rewriting ---
  // Bridges path-based bid URLs (used by other apps) to Nuxt file-system routing.
  // /order/basket/{uuid}/{rest} → /order/{rest}/?bid={uuid}
  // /order/cart/{uuid}/{rest}   → /order/{rest}/?bid={uuid} (legacy)
  const bidPathMatch = path.match(
    new RegExp(`^/order/(?:basket|cart)/(${RegexMatch.UUID})/(.+)$`)
  );
  if (bidPathMatch) {
    const [, bid, rest] = bidPathMatch;
    return navigateTo({
      path: `/order/${rest}/`,
      query: { ...to.query, bid }
    });
  }

  // /order/basket/{uuid} (bare) → /order/basket/?bid={uuid}
  // /order/cart/{uuid} (bare)   → /order/basket/?bid={uuid} (legacy)
  const bidOnlyMatch = path.match(
    new RegExp(`^/order/(?:basket|cart)/(${RegexMatch.UUID})$`)
  );
  if (bidOnlyMatch) {
    const [, bid] = bidOnlyMatch;
    return navigateTo({
      path: `/order/basket/`,
      query: { ...to.query, bid }
    });
  }

  // --- Route Renames ---

  // /order/cart -> /order/basket
  if (path === "/order/cart") {
    return navigateTo(
      { name: ROUTE.BASKET, query: to.query },
      { redirectCode: 301 }
    );
  }

  // /order/products -> /order/shop
  if (path === "/order/products") {
    return navigateTo(
      { name: ROUTE.CATALOGUE, query: to.query },
      { redirectCode: 301 }
    );
  }

  // --- Plural to Singular ---

  // /orders/:oid -> /order/:oid
  const ordersMatch = path.match(
    new RegExp(`^/orders/(${RegexMatch.UUID})/?$`)
  );
  if (ordersMatch) {
    return navigateTo(
      {
        name: ROUTE.ORDER,
        params: { oid: ordersMatch[1] },
        query: to.query
      },
      { redirectCode: 301 }
    );
  }

  // --- Product Route Migrations ---

  // /order/product/edit/:bpid -> /order/basket/:bpid
  const productEditMatch = path.match(
    new RegExp(`^/order/product/edit/(${RegexMatch.UUID})/?$`)
  );
  if (productEditMatch) {
    return navigateTo(
      {
        name: ROUTE.BASKET_PRODUCT_EDIT,
        params: { bpid: productEditMatch[1] },
        query: to.query
      },
      { redirectCode: 301 }
    );
  }

  // /order/product/add/:pid -> /order/product/:pid
  const productAddMatch = path.match(
    new RegExp(`^/order/product/add/(${RegexMatch.UUID})/?$`)
  );
  if (productAddMatch) {
    return navigateTo(
      {
        name: ROUTE.PRODUCT_CONFIGURE,
        params: { pid: productAddMatch[1] },
        query: to.query
      },
      { redirectCode: 301 }
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: SYNTACTIC SUGAR ROUTES
  // Convenience routes that resolve to internal destinations
  // ---------------------------------------------------------------------------

  // /storefront - Resolves to external URL, internal catalogue, or basket
  if (path === "/storefront") {
    const { hasStorefront, storefrontUrl } = useBrand();

    // Priority 1: External storefront URL (e.g., brand's main website)
    if (storefrontUrl.value) {
      return navigateTo(storefrontUrl.value, { external: true });
    }

    // Priority 2: Internal catalogue if storefront is enabled
    if (hasStorefront.value) {
      return navigateTo({ name: ROUTE.CATALOGUE });
    }

    // Fallback: Basket page
    return navigateTo({ name: ROUTE.BASKET });
  }
});
