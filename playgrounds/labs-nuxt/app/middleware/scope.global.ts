import { isArray, join } from "lodash-es";
import {
  parseScopeSuffix,
  stripScopeSuffix
} from "~/composables/scope/scope-mapper";
/**
 * Global Scope Middleware
 *
 * Parses scope suffix from URL and attaches to route.meta for composables to read.
 * Migrated from labs vue-router beforeEach guard to Nuxt middleware.
 *
 * Responsibilities:
 * - Parse scope suffix from URL (/as/:actor/for/:type/:id)
 * - Attach parsed scope to route.meta.scopeConfig
 * - Redirect invalid scope formats to base route
 */
export default defineNuxtRouteMiddleware(to => {
  const rawSuffix = to.params.scopeSuffix;

  // Nuxt catch-all routes return an array of path segments, join them back
  const scopeSuffix = isArray(rawSuffix) ? join(rawSuffix, "/") : rawSuffix;

  if (!scopeSuffix) {
    // No scope suffix - clear any existing scope config and proceed
    if (to.meta) {
      to.meta.scopeConfig = undefined;
    }
    return;
  }

  const parsed = parseScopeSuffix(scopeSuffix);

  if (!parsed.valid) {
    // Invalid scope format - redirect to base route without scope
    const basePath = stripScopeSuffix(to.path);
    console.warn(
      `[scope middleware] Invalid scope suffix: ${parsed.error}. Redirecting to: ${basePath}`
    );
    return navigateTo({ path: basePath }, { replace: true });
  }

  // Valid scope - attach to meta for composables to read
  if (to.meta) {
    to.meta.scopeConfig = {
      actor: parsed.actor,
      context: parsed.context
    };
  }
});
