/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `RefinementsRow` / `Refinement` node exists in the tree, and neither the word
 * "refinement" nor "chip" appears in it at all, so nothing here restates an
 * existing shape. The seam is NOT minted: `ModulePortCriteria`
 * (`composables/useModulePort.types`) is consumed as-is, and the
 * `(column, operator)` vocabulary is the graph's own
 * `usecriteriaurlsync_declaredpairs` node, consumed rather than re-derived. See
 * `graphify-out/GRAPH_REPORT.md`. Re-queried 2026-08-13 over the same
 * `graphify-out/graph.json` for a replay-LOCK shape (`lock*`): the twelve
 * matches are all `block*` parser helpers, so nothing exists to consume — and
 * nothing is minted either, the lock being a boolean on the props already here.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/RefinementsRow.types
 * @description Type definitions for the refinements row — what the collection
 * is narrowed BY right now, one removable chip per active leaf.
 */

import type { ModulePortCriteria } from "../composables/useModulePort.types";

// -----------------------------------------------------------------------------

export type RefinementsRowProps = {
  /**
   * The cell's own request state — the schema that declares what may narrow,
   * the live model, and the composable's own merging write. The SAME seam the
   * filter bar reads and writes, so the controls and the chips can never
   * disagree about which filters are on.
   */
  criteria: ModulePortCriteria;
  /**
   * A scenario is driving the collection, so what narrows it is the script's
   * (`R6-23`). The chips stay READABLE — they are the report of what the
   * scenario asked for — and only their removal is refused.
   */
  locked?: boolean;
};

/**
 * One active narrowing — a declared `(column, operator)` leaf carrying a value.
 * The search term is one of these like any other: it is a filter leaf, not a
 * second kind of state.
 */
export type Refinement = {
  /** `<column>.<operator>` — the leaf's own identity, and what a chip is keyed by. */
  id: string;
  /** The wire column the leaf narrows. */
  column: string;
  /** The declared operator — the leaf's key under that column. */
  operator: string;
  /** The leaf's live value, carried so a removal can write every OTHER leaf back. */
  value: unknown;
  /** What the chip says: the column's declared title and the value it is set to. */
  label: string;
};
