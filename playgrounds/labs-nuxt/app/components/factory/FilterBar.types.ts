/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-08, 19273 nodes) — no
 * `FilterBar` / `FilterBarProps` node exists in the tree, and no other filter
 * surface is declared anywhere; the criteria shape itself is NOT minted here —
 * `ModulePortCriteria` (`factory/useModulePort.types`) is consumed as-is. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module factory/FilterBar.types
 * @description Type definitions for the holistic filter bar.
 */

import type { ModulePortCriteria } from "../../composables/factory/useModulePort.types";

// -----------------------------------------------------------------------------

export type FilterBarProps = {
  /** The cell's own request state — schema, uischema, live model, and the composable's merging write. */
  criteria: ModulePortCriteria;
};
