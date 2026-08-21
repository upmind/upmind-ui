/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-08, 19273 nodes) — no
 * `SCENARIO_WORLD_KEY` or equivalent bridge-handle node exists in the tree;
 * `World` in `@upmind-automation/scenario-harness` is the seam both executors
 * implement and is consumed, not restated. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioWorld.types
 * @description The in-page world's bridge handle. It lives in a RUNTIME-FREE
 * module on purpose: the out-of-process Playwright driver must be able to name
 * the handle without importing the app — importing the world itself would drag
 * the whole headless runtime into the test process.
 */
// -----------------------------------------------------------------------------

/**
 * Where the in-page world is published for an out-of-process driver to reach.
 * Named once, read by the plugin that publishes it and the bridge that drives
 * it, so the two cannot drift.
 */
export const SCENARIO_WORLD_KEY = "__upmindScenarioWorld";
