/**
 * Global Redirects Middleware
 *
 * Handles URL normalization, legacy redirects, and syntactic sugar routes.
 * Organized into clear sections for maintainability.
 */
export default defineNuxtRouteMiddleware(async to => {
  const rawPath = to.path;

  // ---------------------------------------------------------------------------
  // SECTION 0: LEGACY ROUTES
  // ---------------------------------------------------------------------------
  // Headless builds every payment-gateway return as `order/<id>`; labs serves
  // invoices from the invoice scenario, so the return lands there.
  const order = /^\/order\/([^/]+)\/?$/.exec(rawPath);
  if (order) {
    return navigateTo(
      { path: `/useInvoice/${order[1]}/`, query: to.query, hash: to.hash },
      { redirectCode: 301 }
    );
  }

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
});
