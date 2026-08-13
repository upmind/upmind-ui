/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-13, 7457 nodes) — no
 * `ScenarioMenu` / `ScenarioChoice` node exists anywhere in the tree, so the
 * choice union is minted. What it does NOT mint: a scenario IS
 * `useFeatureTracks`' own `FeatureTrack` (T4.1) and a forced state IS
 * `useForcedState`'s own `ForceUrlPreset`, both passed through whole rather than
 * re-shaped into a menu-item type; the entries themselves are
 * `@upmind-automation/upmind-ui`'s `ButtonGroupItem` / `DropdownMenuItemProps`.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ScenarioMenu.types
 * @description Type definitions for the bar's ONE menu — the single place a
 * page's non-live states are chosen (`R7-10`, `R7-11`): the scenarios in one
 * group, the forced states in another, and Live beside it as the way back.
 */

import type { FeatureTrack } from "../composables/useFeatureTracks.types";
import type {
  ForcePreset,
  ForceUrlPreset
} from "../composables/useForcedState.types";

// -----------------------------------------------------------------------------

/** The Live entry's handle. Live is a track with no scenes, so it has no slug. */
export const TRACK_LIVE = "live";

/**
 * What a pick MEANS. A scenario and a forced state are both a page's non-live
 * state, but they are armed through different handles — the player owns one,
 * the worker the other — so the menu says which was chosen and the bar, which
 * holds both handles, decides what that costs (arming either releases the
 * other; they are alternatives, never a stack).
 */
export const SCENARIO_CHOICE = {
  LIVE: "live",
  TRACK: "track",
  FORCE: "force"
} as const;

export type ScenarioChoice =
  | { kind: typeof SCENARIO_CHOICE.LIVE }
  | { kind: typeof SCENARIO_CHOICE.TRACK; track: FeatureTrack }
  | { kind: typeof SCENARIO_CHOICE.FORCE; preset: ForceUrlPreset };

export type ScenarioMenuProps = {
  /** The page's whole playlist. Empty is Live alone — the correct degraded state (`S12`). */
  tracks: readonly FeatureTrack[];
  /** The armed track, if one is playing. */
  armed?: FeatureTrack;
  /** The forced state actually being served, if one is armed. */
  preset?: ForcePreset;
  /**
   * Nothing non-live can be armed at all — the corpus cannot answer, so replay
   * would re-fire writing scenes against staging and a preset would have no
   * recording to serve (`ESC6`, `AC2.6`). The entries are disabled rather than
   * absent: a control that fires nothing is the dead-alive control `S14`
   * forbids, and a menu with nothing in it explains nothing.
   */
  disabled?: boolean;
};

export type ScenarioMenuEmits = {
  /** The pick, said as what it means. The menu owns no player and writes no url. */
  select: [choice: ScenarioChoice];
};
