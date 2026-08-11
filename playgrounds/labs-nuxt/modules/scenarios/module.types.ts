/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * `DiscoveredScenario` node exists in the tree; `NuxtPage` is `@nuxt/schema`'s
 * and is consumed, never re-declared. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/module.types
 * @description Build-context types for the scenario registrar. Separate from
 * `runtime/scenario.types.ts` on purpose: nothing here is reachable from the
 * app, and nothing there may be imported into the Node/jiti context.
 */

// -----------------------------------------------------------------------------

/** One discovered scenario directory, before it becomes a route. */
export type DiscoveredScenario = {
  /** The directory name — the url segment AND the route name. */
  route: string;
  /** Its declaration file, absolute. */
  file: string;
};
