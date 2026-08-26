/**
 * @module scope/scope-helpers
 * @description Scope helpers — the ONE reading of a module's scope matrix, plus
 * building and navigating to scope-aware URLs.
 *
 * IMPORTANT: `updateScopeParam` uses Vue Router's `useRoute`/`useRouter`, which
 * rely on `inject()`. It MUST be obtained via `useScopeNavigation()` during
 * component setup — calling it as a standalone function from an event handler
 * will fail.
 *
 * `buildPathPreservingBrand` and `navigateToScope` are DELETED, not moved: both
 * had zero callers, and each call site that needs a brand-preserving path
 * already reads the segment itself and hands it to `buildScopePath`.
 */

import { useRouter, useRoute } from "vue-router";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { filter, get } from "lodash-es";
import type {
  ActorContextMatrix,
  ScopeContext
} from "@upmind-automation/headless";

/**
 * The context type a matrix cell names, or `null` where the module marked the
 * actor `never`. This is the app's ONE reading of a scope matrix: a cell naming
 * no type is an actor the module does not serve — the row the acting-for picker
 * greys (`AC1.4`) and the scope the port refuses to boot (`R7-14`).
 */
export function resolveMatrixContext(contextType: unknown): string | null {
  return contextType && contextType !== "never" ? String(contextType) : null;
}

/**
 * Whether a module's own matrix serves the actor a url NAMED.
 *
 * `SELF` is always served: it names no actor at all — the builder resolves it to
 * whoever is active — so refusing it would refuse the bare route every page
 * boots on, including the logged-out one whose answer is the auth gate rather
 * than a scope refusal. Only an `/as/:actor` segment can be refused here. A
 * composable registered without a matrix declares no refusal.
 */
export function servesActor(
  matrix: ActorContextMatrix | undefined,
  actor: ScopeActorTypes
): boolean {
  if (!matrix || actor === ScopeActorTypes.SELF) return true;
  return !!resolveMatrixContext(get(matrix, actor));
}

export type ScopePathConfig = {
  /** Page path (e.g., "useAuth", "products") */
  page: string;
  /** Brand ID or 'org' for org-wide mode */
  brandId?: string;
  /** Actor scope */
  actor?: ScopeActorTypes;
  /** Context scope */
  context?: ScopeContext;
};

/**
 * Build a scope-aware URL path from configuration.
 * Constructs: /as/:actor (homepage, no brand)
 * Or: /:page/as/:actor (specific page, no brand)
 * Or: /:brandId/as/:actor (homepage with brand)
 * Or: /:brandId/:page/as/:actor/for/:type/:id (full path)
 *
 * @param config - Scope path configuration
 * @returns Full path string
 *
 * @example
 * buildScopePath({ page: "", actor: ScopeActorTypes.STAFF })
 * // => "/as/user" (STAFF = "user", not "staff")
 *
 * @example
 * buildScopePath({ page: "useAuth", actor: ScopeActorTypes.STAFF })
 * // => "/useAuth/as/user"
 *
 * @example
 * buildScopePath({ page: "useAuth", brandId: "brand-x", actor: ScopeActorTypes.STAFF })
 * // => "/brand-x/useAuth/as/user"
 *
 * @example
 * buildScopePath({
 *   page: "orders",
 *   actor: ScopeActorTypes.STAFF,
 *   context: { type: "client", id: "123" }
 * })
 * // => "/orders/as/user/for/client/123"
 */
export function buildScopePath(config: ScopePathConfig): string {
  const { page, brandId, actor, context } = config;

  // Build path segments (filter out empty page for homepage)
  const segments: string[] = [];

  // Add brand if specified (and not org)
  if (brandId && brandId !== "org") {
    segments.push(brandId);
  }

  // Add page if specified (skip empty for homepage)
  if (page) {
    segments.push(page);
  }

  // Start with base path (handle empty segments for homepage)
  let path = segments.length > 0 ? `/${segments.join("/")}` : "";

  // Add actor scope if specified (and not SELF)
  if (actor && actor !== ScopeActorTypes.SELF) {
    path += `/as/${actor}`;

    // Add context if specified
    if (context) {
      path += `/for/${context.type}/${context.id}`;
    }
  }

  // Ensure we always return at least "/" for homepage without scope
  return path || "/";
}

/**
 * Composable that provides scope navigation helpers.
 * Captures `useRoute()`/`useRouter()` during setup so returned functions
 * can safely be called from event handlers, async callbacks, etc.
 *
 * @returns Navigation helper functions
 *
 * @example
 * const { updateScopeParam } = useScopeNavigation();
 *
 * async function handleClick() {
 *   await updateScopeParam("context", { type: "client", id: "123" });
 * }
 */
export function useScopeNavigation() {
  const route = useRoute();
  const router = useRouter();

  /**
   * Update a single scope parameter while preserving others.
   * Reads current scope from route, updates specified param, and navigates.
   *
   * @param param - Which parameter to update
   * @param value - New value for the parameter
   * @returns Promise that resolves when navigation completes
   *
   * @example
   * // Current URL: /useAuth/as/user (STAFF = "user")
   * await updateScopeParam("context", { type: "client", id: "123" })
   * // New URL: /useAuth/as/user/for/client/123
   *
   * @example
   * // Current URL: /brand-x/useAuth/as/user/for/client/123
   * await updateScopeParam("actor", ScopeActorTypes.CLIENT)
   * // New URL: /brand-x/useAuth/as/client
   */
  function updateScopeParam(
    param: "brandId" | "actor" | "context",
    value: string | ScopeActorTypes | ScopeContext | undefined
  ): Promise<void> {
    // Get current scope
    const currentBrand = route.params.brandIdOrOrg as string | undefined;
    const scopeConfig = route.meta.scopeConfig as
      | { actor?: ScopeActorTypes; context?: ScopeContext }
      | undefined;
    const currentActor = scopeConfig?.actor;
    const currentContext = scopeConfig?.context;

    // Extract page name from current path
    const pathParts = filter(route.path.split("/"), Boolean);
    // If no brand param, page is first segment; otherwise second segment
    const page = currentBrand ? pathParts[1] || "" : pathParts[0] || "";

    // Build new config with updated param
    const newConfig: ScopePathConfig = {
      page,
      brandId: param === "brandId" ? (value as string) : currentBrand,
      actor: param === "actor" ? (value as ScopeActorTypes) : currentActor,
      context: param === "context" ? (value as ScopeContext) : currentContext
    };

    const newPath = buildScopePath(newConfig);
    return router.push(newPath).then(() => undefined);
  }

  return { updateScopeParam };
}
