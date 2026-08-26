/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `ScenarioPresentation` / `ScenarioAction` / `TableCell` / `ResolvedHandoff`
 * node exists in the tree; all four are minted once in
 * `runtime/scenario.types.ts` and consumed here rather than re-declared. No
 * list-view node exists either, so `ListViewTypes` is minted here — the toggle
 * is url state the playground's one writer owns (AC9.1), never a declaration.
 * `LIST_SURFACE_ACTION` is deleted rather than moved: with the actions declared
 * per scenario, a renderer-side vocabulary of one module's action names has no
 * consumer left. See `graphify-out/GRAPH_REPORT.md`. Re-queried 2026-08-13 over
 * the same `graphify-out/graph.json` for a replay-LOCK shape (`lock*`): the
 * twelve matches are all `block*` parser helpers, so nothing exists to consume
 * — and nothing is minted either, the lock being a boolean on the props here.
 * `RowCellProps` is DELETED rather than moved: a cell renderer is handed the
 * registry's own `TableCellProps` (`components/cells/cells.types.ts`), and a
 * second prop shape beside it would be the same fact told twice (`R6-36`).
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ListSurface.types
 * @description Type definitions for the List archetype surface — TanStack
 * controlled/manual-mode binding to `port.table`, drawn from the scenario's own
 * declaration.
 */

// `ResolvedDetail` added below is minted once in `runtime/scenario.types.ts`
// and consumed here — see its `graphify-out/graph.json` (2026-08-14) citation.
import type { SurfaceProps } from "./surface.types";
import type { ModulePortCriteria } from "../../composables/useModulePort.types";
import type { DeclaringTableChannel } from "../../composables/useTableChannel.types";
import type {
  ResolvedDetail,
  ResolvedHandoff,
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
   * The scenario's declared handoffs, bound by the playground to the editor
   * composable that drives them. A declared control that opens one is offered
   * only where its handoff is here — a control with nothing behind it is the
   * inert Add button all over again (C2).
   */
  handoffs?: Record<string, ResolvedHandoff>;
  /**
   * The scenario's bound read composable, opened by a `detail` action. Present
   * iff the scenario declares `useDetail`; absent, a `detail` action still opens
   * the overlay on the clicked row's own data. See the `graphify-out/` citation
   * on `ResolvedDetail` in `scenario.types.ts`.
   */
  detail?: ResolvedDetail;
  /**
   * A scenario is driving this surface, so it is a PLAYBACK: every control that
   * writes — the facets and the search, the chips, ordering, the column set,
   * the view, pagination and every row action — refuses, and says why, until
   * Live releases it (`R6-23`). Reading the rows is untouched: a replay exists
   * to be watched.
   */
  locked?: boolean;
};

/** Which of the two empty sentences a list tells. */
export type ListEmptyProps = {
  isFiltered?: boolean;
};

/**
 * What went wrong on ONE record, drawn under the record it happened to. The
 * message is already resolved by the surface that fired the action — the API's
 * own sentence wherever it gave one.
 */
export type RowFailureProps = {
  message: string;
  /**
   * Whether re-firing the refused action is allowed RIGHT NOW — the same two
   * guards every other row control carries (`R6-23`): a scenario driving the
   * surface, and the action's own row rule. Retry is a real mutation, so a
   * replay-locked surface refuses it exactly as it refuses the row menu.
   *
   * Re-queried `graphify-out/graph.json` (2026-08-26) for a retry-guard shape:
   * the only match is headless's `canRetryAuthorization()`
   * (`modules/query/query.utils.ts`), a 3DS authorization predicate with no
   * bearing on a row action — so nothing exists to consume, and nothing is
   * minted either, the refusal being a boolean on the props already here.
   */
  canRetry?: boolean;
};
