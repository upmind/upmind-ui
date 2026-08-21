/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-11, 6795 nodes) — no
 * `ScenarioBar` / `TrackList` / playlist / media-bar node exists anywhere in the
 * tree, so this contract is minted. What it does NOT mint: the playlist shape is
 * `useFeatureTracks`' `FeatureTrack` (T4.1) and the transport is
 * `useScenarioPlayer`'s own `UseScenarioPlayer` handle (T4.2) — the bar draws
 * that one player rather than holding a second model of a track. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ScenarioBar.types
 * @description What the page hands its scenario bar: the playlist, and the ONE
 * player both the bar and the sheet panes read (design §3.1).
 */

import type { FeatureTrack } from "../composables/useFeatureTracks.types";
import type { UseScenarioPlayer } from "../composables/useScenarioPlayer.types";

// -----------------------------------------------------------------------------

export type ScenarioBarProps = {
  /**
   * The page's ONE player, created where the port is (`S19`). It is handed IN
   * rather than created here because the sheet panes read the same playhead:
   * a bar that owned the player would leave them reading a second one, and two
   * players each own `track=`.
   */
  player: UseScenarioPlayer;
  /** The page's playlist. Empty renders Live and no transport (`S12`, `AC2.3`). */
  tracks: readonly FeatureTrack[];
};
