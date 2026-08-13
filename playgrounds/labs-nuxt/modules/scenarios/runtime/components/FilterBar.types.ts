/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-08, 19273 nodes) — no
 * `FilterBar` / `FilterBarProps` node exists in the tree, and no other filter
 * surface is declared anywhere; the criteria shape itself is NOT minted here —
 * `ModulePortCriteria` (`factory/useModulePort.types`) is consumed as-is. See
 * `graphify-out/GRAPH_REPORT.md`. Re-queried 2026-08-13 over
 * `graphify-out/graph.json` for a replay-LOCK shape (`lock*`): the twelve
 * matches are all `block*` parser helpers, so nothing exists to consume — and
 * nothing is minted either, the refusal being the ui `Form`'s own `disabled`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/FilterBar.types
 * @description Type definitions for the holistic filter bar.
 */

import type { ModulePortCriteria } from "../composables/useModulePort.types";

// -----------------------------------------------------------------------------

export type FilterBarProps = {
  /** The cell's own request state — schema, uischema, live model, and the composable's merging write. */
  criteria: ModulePortCriteria;
  /**
   * Every facet and the search box refuse the write while a scenario drives the
   * collection (`R6-23`) — the whole bar through the form's OWN `disabled`, so
   * a control the declaration adds later is locked with nothing added here.
   */
  disabled?: boolean;
};
