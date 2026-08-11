/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `SortControl` / `SortControlProps` / `SortField` node exists in the tree. The
 * only sort controls in the graph are `EmailHistorySort.vue` and
 * `ProductSort.vue` (`packages/client-vue`), each bound to its own module's
 * hardcoded sortable-property enum, so neither is consumable by a
 * declaration-driven surface — their `ButtonGroup` treatment is adopted, the
 * components are not re-declared. The sort model itself is
 * `@upmind-automation/scenario-harness`'s `TableModel["sort"]`, consumed as-is.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SortControl.types
 * @description Type definitions for the toolbar's sort control.
 */

import type { TableModel } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** One offered sort field — the WIRE field, under the column's own label. */
export type SortField = {
  value: string;
  label: string;
};

export type SortControlProps = {
  /**
   * The fields offered, in declaration order: the columns the scenario declared
   * sortable that the module's query schema also declares. A field the schema
   * never declared is an `order=` column the API answers with a 500.
   */
  fields: SortField[];
  /** The live sort model — the SAME one the table headers read and write. */
  sort: TableModel["sort"];
};
