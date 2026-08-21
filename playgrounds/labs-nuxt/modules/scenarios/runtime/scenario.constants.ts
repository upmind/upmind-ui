// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/scenario.constants
 * @description The two names the BUILD-time registrar and the APP runtime must
 * spell identically. Kept dependency-free on purpose: the registrar imports it
 * from the Node/jiti context, where nothing vue-shaped may be reached.
 */

// -----------------------------------------------------------------------------

/** The route-meta property carrying a route's scenario key. */
export const SCENARIO_ROUTE_META_KEY = "scenario";

/**
 * The catch-all every scenario route ends in — the scope suffix
 * (`/as/:actor/for/:type/:id`) the global scope middleware parses off
 * `params.scopeSuffix`, matching what the file-based `[...scopeSuffix]` pages
 * already produce. A route without it drops identity-retargeting silently.
 */
export const SCOPE_SUFFIX_SEGMENT = "/:scopeSuffix(.*)*";

/**
 * Which files under the module directory are scenario declarations: one per
 * directory, named for the MODULE it declares (`R6-27`) — the directory stays
 * the url segment, so the two names answer different questions.
 */
export const SCENARIO_DECLARATION_GLOB = "*/*.scenario.ts";
