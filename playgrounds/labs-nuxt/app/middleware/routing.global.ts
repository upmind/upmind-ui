import {
  useRoutingEngine,
  hasRouteChanged
} from "@upmind-automation/client-vue";
/**
 * Global Routing Middleware
 *
 * Handles route guarding and funnel switching for each navigation.
 * Route decoration is handled at initialization in the upmind plugin.
 *
 * Responsibilities:
 * - Wait for Upmind to be ready (parallel plugin may still be initializing)
 * - Route guarding via useRoutingEngine
 * - Funnel switching based on query parameters
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip if route hasn't meaningfully changed
  if (from.name === to.name && from.path === to.path) {
    return;
  }

  const { guard, switchFunnel } = useRoutingEngine();

  // Handle funnel switching if query param present
  if (to.query?.funnel) {
    await switchFunnel(to.query.funnel.toString(), to);
  }

  // Run route guard - may redirect to a different route
  const target = await guard(to);

  // Only redirect if target exists and route has meaningfully changed
  if (target && hasRouteChanged(to, target)) {
    return navigateTo(target);
  }
});
