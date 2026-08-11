/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `ScenarioPresentation` / `ScenarioAction` / `RowElement` / `ResolvedHandoff`
 * node exists in the tree; all four are minted once in
 * `runtime/scenario.types.ts` and consumed here rather than re-declared. No
 * list-view node exists either, so `ListViewTypes` is minted here — the toggle
 * is ephemeral view state the renderer owns (AC2), never a declaration.
 * `LIST_SURFACE_ACTION` is deleted rather than moved: with the actions declared
 * per scenario, a renderer-side vocabulary of one module's action names has no
 * consumer left. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ListSurface.types
 * @description Type definitions for the List archetype surface — TanStack
 * controlled/manual-mode binding to `port.table`, drawn from the scenario's own
 * declaration.
 */

import type { SurfaceProps } from "./surface.types";
import type { ModulePortCriteria } from "../../composables/useModulePort.types";
import type { DeclaringTableChannel } from "../../composables/useTableChannel.types";
import type {
  ResolvedHandoff,
  RowElement,
  ScenarioPresentation
} from "../../scenario.types";

// -----------------------------------------------------------------------------

/** A List row is whatever plain shape the composable's `context.data` carries. */
export type ListRow = Record<string, unknown>;

/** Which of the scenario's two row declarations the same rows are drawn from. */
export enum ListViewTypes {
  TABLE = "table",
  CARD = "card"
}

export type ListSurfaceProps = SurfaceProps & {
  /** The controlled-table seam — present iff the module owns table state (`classify`'s `hasTable`); absent modules degrade to a read-only row list. */
  table?: DeclaringTableChannel;
  /**
   * The cell's own request state — the module's query schema, uischema, live
   * model and merging write. Present iff the module publishes criteria, which
   * is the same condition the table channel exists under: the bar that steers
   * the list belongs in the list's own toolbar, not on a line above it.
   */
  criteria?: ModulePortCriteria;
  /**
   * The scenario's own declaration: which columns exist and how each cell
   * draws, the same row as a card, and every action's presentation and
   * precondition. Absent, the surface renders the rows read-only — it never
   * guesses a column set off the row's keys.
   */
  presentation?: ScenarioPresentation;
  /**
   * The scenario's declared handoffs, resolved by the playground. A declared
   * control that opens one is offered only where its handoff is here — a
   * control with nothing behind it is the inert Add button all over again (C2).
   */
  handoffs?: Record<string, ResolvedHandoff>;
};

/** One declared field of one row, drawn as the declaration says. */
export type RowCellProps = {
  element: RowElement;
  row: ListRow;
};

/** Which of the two empty sentences a list tells. */
export type ListEmptyProps = {
  isFiltered?: boolean;
};
