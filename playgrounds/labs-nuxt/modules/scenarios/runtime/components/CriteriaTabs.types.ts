/**
 * @graphify-citation `graphify query "criteria tab pair status filter listing
 * tabs"` (2026-09-17, `graphify-out/graph.json`, 785 nodes reached) — no
 * criteria-tab / tab-pair / filter-tab props node exists in the tree. Nothing
 * is minted here either: {@link CriteriaTabsUischema} is declared once in
 * `runtime/scenario.types.ts` and {@link ModulePortCriteria} in
 * `composables/useModulePort.types.ts`, both consumed as-is — the same
 * construction `FilterBar.types.ts` uses for the bar beside it. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/CriteriaTabs.types
 * @description Type definitions for the declared criteria tab pair.
 */

import type { ModulePortCriteria } from "../composables/useModulePort.types";
import type { CriteriaTabsUischema } from "../scenario.types";

// -----------------------------------------------------------------------------

export type CriteriaTabsProps = {
  /** The scenario's declared tabs — their labels and the leaves each writes. */
  tabs: CriteriaTabsUischema;
  /** The cell's own request state — the live model read, the composable's merging write. */
  criteria: ModulePortCriteria;
  /**
   * The tab pair refuses the write while a scenario drives the collection
   * (`R6-23`), exactly as the filter bar beside it does. Reading which tab is
   * in effect is never locked — a replay exists to be watched.
   */
  disabled?: boolean;
};
