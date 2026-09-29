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
  /**
   * The module's own recorded refusal sentence, while the page is FORCED into
   * `error-action`. A forced state is the state, forced: it renders on arming
   * and asks for no interaction (operator ruling, 2026-08-28), so the surface
   * draws its FIRST row already refused with this sentence rather than waiting
   * for a control to be pressed. The collection stays intact — a refused write
   * is row-scoped, and the whole-surface error state belongs to a failed READ
   * alone (`R6-19`).
   *
   * Which row does not depend on which controls that row happens to expose: a
   * refusal is a state of the RECORD, and a collection whose rows offer only a
   * read-only detail overlay drew nothing at all while its corpus answered the
   * preset perfectly well (operator ruling, 2026-08-28 · Q). The offer is
   * measured off the recordings, never off what a page exposes.
   *
   * @graphify-citation `graphify query "is there an existing contract naming
   * which row a forced refusal is drawn on"` (2026-08-29, FE-3113 Q) — the only
   * nodes are this prop itself (`ScenarioPlayground.vue` L272) and the test
   * lane's rendered-proof harness (since retired), which app runtime may not
   * consume. Nothing is minted: the ruling narrows which row the EXISTING
   * string is drawn on. See `graphify-out/GRAPH_REPORT.md`.
   *
   * Absent on Live and under every other preset.
   *
   * @graphify-citation `graphify query "is there an existing contract or field
   * carrying a recorded write refusal fixture or a refusal sentence for a forced
   * row"` (2026-08-28, FE-3113 O) — the only matches were the test lane's
   * former `refusalSentences()` (since retired) and `refusalsOf()`
   * (`force/__tests__/force-presets-all-modules.spec.ts`) helpers, which app
   * runtime may not consume. Nothing is minted: the sentence rides as a string
   * on the props already here, derived by `force/presets.ts`'s `presetRefusal`
   * off the `RecordedFixture` the corpus already carries. See
   * `graphify-out/GRAPH_REPORT.md`.
   */
  forcedRefusal?: string;
  /**
   * The cell's own `useMeta()` members, raw — `ModulePort.rawMeta()` relayed
   * by `ModuleRenderer`, never re-derived here. Read only for the scopes the
   * scenario NAMES in `presentation.notices`; absent or missing a named key,
   * that notice draws nothing (2026-09-09 operator sign-off).
   *
   * @graphify-citation `graphify-out/graph.json` (2026-09-09) — queried
   * "raw uncoerced meta number count channel bypass CompositionPort": no
   * such prop exists in the tree; `ModulePort.rawMeta` (minted the same pass,
   * `useModulePort.types.ts`) is the source this relays, additively.
   */
  notices?: Record<string, boolean | number>;
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
  /**
   * Whether the strip stays until it is dismissed. A refusal the surface FIRED
   * arrived with a toast and leaves on the toast's own clock, so the two
   * verdicts of one action go together; a FORCED one never had a toast, and
   * fading it out would take away the very state the preset holds the page in.
   *
   * @graphify-citation `graphify query "is there an existing persist or auto
   * dismiss or sticky flag on a notification or alert strip contract"`
   * (2026-08-28, FE-3113 O) — the neighbours are `AnnouncementBar.vue`'s own
   * `dismiss()` (L65), `Shell.vue`'s `stickyOffset` (L87, a layout offset) and
   * `session-store.utils.ts`'s `persistTokenToStorage()` (L240, storage), none
   * of them a display-lifetime contract to consume. Nothing is minted either —
   * it is a boolean on the props already here. See `graphify-out/GRAPH_REPORT.md`.
   */
  persist?: boolean;
};
