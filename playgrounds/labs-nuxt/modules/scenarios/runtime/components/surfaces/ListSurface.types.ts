/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * `ScenarioPresentation` / `ScenarioAction` / `RowElement` node exists in the
 * tree; all three are minted once in `runtime/scenario.types.ts` and consumed
 * here rather than re-declared. `LIST_SURFACE_ACTION` is deleted rather than
 * moved: with the actions declared per scenario, a renderer-side vocabulary of
 * one module's action names has no consumer left. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ListSurface.types
 * @description Type definitions for the List archetype surface — TanStack
 * controlled/manual-mode binding to `port.table`, drawn from the scenario's own
 * declaration.
 */

import type { SurfaceProps } from "./surface.types";
import type { DeclaringTableChannel } from "../../composables/useTableChannel.types";
import type { ScenarioPresentation } from "../../scenario.types";

// -----------------------------------------------------------------------------

/** A List row is whatever plain shape the composable's `context.data` carries. */
export type ListRow = Record<string, unknown>;

export type ListSurfaceProps = SurfaceProps & {
  /** The controlled-table seam — present iff the module owns table state (`classify`'s `hasTable`); absent modules degrade to a read-only row list. */
  table?: DeclaringTableChannel;
  /**
   * The scenario's own declaration: which columns exist and how each cell
   * draws, the same row as a card, and every action's presentation and
   * precondition. Absent, the surface renders the rows read-only — it never
   * guesses a column set off the row's keys.
   */
  presentation?: ScenarioPresentation;
};
