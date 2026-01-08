/**
 * Global Routing Middleware
 *
 * This middleware replaces the client-side routing logic from useRouting.ts
 * It runs on both server and client, preventing FOUT by resolving routes before render.
 *
 * Responsibilities:
 * - Route guarding via useRoutingEngine
 * - Route decoration with brand-specific UI schemas
 * - Funnel switching based on query parameters
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client-side for now since useRoutingEngine may use browser APIs
  // TODO: Extract SSR-compatible parts of the routing engine
  // if (!import.meta.client) {
  //   return;
  // }
  // // Skip if route hasn't meaningfully changed
  // if (from.name === to.name && from.path === to.path) {
  //   return;
  // }
  // try {
  //   // Dynamic import to avoid SSR issues with browser-only dependencies
  //   const { useRoutingEngine, useBrand } =
  //     await import("@upmind-automation/headless");
  //   const { guard, switchFunnel } = useRoutingEngine();
  //   const { uischema_Route, uiCart, isReady } = useBrand();
  //   // Dynamically import ROUTE to avoid issues
  //   const { ROUTE } = await import("~/router/types");
  //   // Handle funnel switching if query param present
  //   if (to.query?.funnel) {
  //     await switchFunnel(to.query.funnel.toString(), to);
  //   }
  //   // Run route guard
  //   const target = await guard(to);
  //   // Redirect if guard returns a different route
  //   if (target && hasRouteChanged(to, target)) {
  //     return navigateTo(target);
  //   }
  //   // Decorate route with brand-specific metadata
  //   await isReady();
  //   const fallbackTemplate = uiCart.value?.layout;
  //   const uischema = to.name
  //     ? (uischema_Route?.value?.[to.name as string] ?? {})
  //     : {};
  //   to.meta = {
  //     ...uischema,
  //     template: uischema?.template || fallbackTemplate,
  //     ...to.meta
  //   };
  // } catch (error) {
  //   // Log error but don't block navigation
  //   console.error("[routing.global] Middleware error:", error);
  // }
});

/**
 * Check if route has meaningfully changed
 */
function hasRouteChanged(
  from: { name?: string | symbol | null; path?: string },
  to: { name?: string | symbol | null; path?: string }
): boolean {
  if (!from || !to) return true;
  return from.name !== to.name || from.path !== to.path;
}
