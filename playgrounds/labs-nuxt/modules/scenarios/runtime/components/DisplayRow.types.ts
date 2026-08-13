/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `DisplayRow` / `DisplayRowProps` node exists in the tree, and neither does any
 * results-count or view-choice node. Nothing here is minted: the count is the
 * seam's own `TableModel["pagination"].total`
 * (`@upmind-automation/scenario-harness`), the ordering vocabulary is
 * `SortControl.types`' `SortField` + `TableModel["sort"]`, and the view
 * vocabulary is `ListViewTypes`, minted once in `surfaces/ListSurface.types.ts`
 * and consumed here rather than re-declared. See `graphify-out/GRAPH_REPORT.md`.
 * Re-queried 2026-08-13 over the same `graphify-out/graph.json` for a
 * replay-LOCK shape (`lock*`): the twelve matches are all `block*` parser
 * helpers, so nothing exists to consume — and nothing is minted either, the
 * refusal being the ui `Button` / `ToggleGroup`'s own `disabled`. Re-queried
 * again (7394 nodes) for a column-visibility shape: no `ColumnOption` /
 * `ColumnPicker` node exists, so the option is minted once in
 * `ColumnPicker.types` and consumed here.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DisplayRow.types
 * @description Type definitions for the display row — the data surface's own
 * Results count, ordering, column set and view choice.
 */

import type { ColumnOption } from "./ColumnPicker.types";
import type { SortField } from "./SortControl.types";
import type { ListViewTypes } from "./surfaces/ListSurface.types";
import type { ModulePortCriteria } from "../composables/useModulePort.types";
import type { TableModel } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export type DisplayRowProps = {
  /**
   * The cell's request state, so the row can carry its active refinements
   * inline (`R6-16`). Absent for a collection that declares no criteria, which
   * has nothing to narrow and therefore no chips.
   */
  criteria?: ModulePortCriteria;
  /** How many rows the surface is drawing right now — the *2* of *2 of 3*. */
  count: number;
  /**
   * The collection's own size, the seam's `pagination.total` — the *3*. Absent
   * where the module publishes no total, and the label then says only what is
   * on screen rather than inventing a denominator.
   */
  total?: TableModel["pagination"]["total"];
  /**
   * The ordering fields offered, in declaration order — the collection's real
   * columns, never a presentation composite (`R6-6`). Empty where the module
   * owns no table state: there is then nothing to order and no control.
   */
  fields: SortField[];
  /** The live sort model — the SAME one the column headers read and write. */
  sort: TableModel["sort"];
  /**
   * Every column the table declares, each saying whether it is drawn (`R6-25`).
   * Empty where there are no columns to steer — a card view, or a collection
   * that declares no table — and the picker is then not offered.
   */
  columns?: ColumnOption[];
  /** Which of the scenario's two row declarations is currently drawn. */
  view: ListViewTypes;
  /**
   * Whether the scenario declared a card at all: the view toggle exists only
   * where there is a second declaration to switch to.
   */
  hasCardView?: boolean;
  /**
   * A scenario is driving the collection, so how it is ordered and drawn is the
   * script's (`R6-23`). Every control keeps its live value and refuses the
   * write; the count and the chips beside them stay readable, being a report
   * rather than a control.
   */
  locked?: boolean;
};
