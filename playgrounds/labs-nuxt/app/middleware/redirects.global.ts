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
});
