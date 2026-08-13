/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-12, 7394 nodes) — no
 * `PlaygroundUrlState` / `PlaygroundUrlParams` / `PlaygroundUrlPatch` /
 * `PlaygroundSurfaceParam` node exists in the tree, and no url-state shape
 * under any other name; every shape here is minted for the one writer. The
 * `columns` slot mints nothing further: it is a param NAME on the existing
 * union, and the option shape it serialises is `ColumnPicker.types`' own
 * `ColumnOption`. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module composables/usePlaygroundUrlState.types
 * @description The surface slots the playground's one query-string writer owns,
 * and the handle it hands every consumer — the criteria sync included.
 */

import type { ComputedRef, WritableComputedRef } from "vue";

// -----------------------------------------------------------------------------

/**
 * The url as the writer holds it. A query string holds strings — and the same
 * key more than once, which the mechanism hands back as an array.
 */
export type PlaygroundUrlParams = Record<string, string | string[]>;

/** One writer's params: a string to set the param, `undefined` to clear it. */
export type PlaygroundUrlPatch = Record<string, string | undefined>;

/**
 * The slots this writer owns. Scope is the router's (path segments) and the
 * criteria's own params are the criteria sync's — design §3.4's table.
 */
export type PlaygroundSurfaceParam =
  | "view"
  | "columns"
  | "track"
  | "scene"
  | "sheet"
  | "tab"
  | "force";

export type PlaygroundUrlState = {
  /**
   * The url as it stands, the tick's uncommitted patch included. A snapshot,
   * not the bag: mutating it writes nothing, because `write` is the one path.
   */
  params: ComputedRef<PlaygroundUrlParams>;
  /**
   * The ONE write path. Every writer's patches merge into a single commit per
   * tick, so no writer's params land inside another's write and vanish.
   */
  write: (patch: PlaygroundUrlPatch) => void;
  /** Which renderer is on. */
  view: WritableComputedRef<string | undefined>;
  /**
   * Which of the table's declared columns are drawn — comma-joined keys. Absent
   * means the declaration's own set, which is the default (`R6-25`).
   */
  columns: WritableComputedRef<string | undefined>;
  /** The armed scenario track. */
  track: WritableComputedRef<string | undefined>;
  /** The playhead — an integer, absent when the url carries anything else. */
  scene: WritableComputedRef<number | undefined>;
  /** The open sheet. */
  sheet: WritableComputedRef<string | undefined>;
  /** The open sheet's section. */
  tab: WritableComputedRef<string | undefined>;
  /** The armed force preset. */
  force: WritableComputedRef<string | undefined>;
  /**
   * A path with the current query carried through, for a scope navigation to
   * push — design §7.3's mitigation, owned rather than assumed.
   */
  preserveQuery: (path: string) => string;
};
