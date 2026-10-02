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

/**
 * A module that draws itself. Present beside the declaration, this file is the
 * route's component instead of the shared playground — the module keeps its
 * registration, its nav entry and its url, and only the RENDERING differs. The
 * registrar switches on the file existing, because it may not import the
 * declaration to read a flag off it.
 */
export const MODULE_PAGE_GLOB = "*/*.page.vue";

/**
 * The url param an area's active tab rides — `section=commissions`. Not `tab`:
 * that is the open sheet's section, and the two must never share a value.
 */
export const AREA_SECTION_PARAM = "section";
