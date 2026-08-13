/**
 * @graphify-citation `graphify query "scenario pane playhead gherkin step line
 * list declaration fence"` plus a name grep of `graphify-out/graph.json`
 * (2026-08-10, 6795 nodes) — no `ScenarioPane*`, pane-props or playhead node
 * exists anywhere in the tree, so this view contract is minted. What it does
 * NOT mint: the parsed playlist shapes are the harness's own (`FeatureScenario`
 * / `FeatureStep`, what `parseFeatureScenarios` returns), the armed track's own
 * stops are `TrackScene`s (`useFeatureTracks.types`), and the scope shape is the
 * app's own `ScopeConfig` — the same one `buildScopePath` takes and the player
 * navigates a mismatched track by. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module sheets/ScenarioPane.types
 * @description What the Scenario view is handed: the page's own declaration, the
 * playlist behind it, and — while a track is armed — that track's own stops and
 * the transport to move between them (`AC3.4`, `H4`, `R6-20`, `R6-24`).
 */

import type { TrackScene } from "../../../modules/scenarios/runtime/composables/useFeatureTracks.types";
import type { ScopeConfig } from "../../composables/scope";

// -----------------------------------------------------------------------------

/**
 * What a stop reads as at a glance, in BOTH views of the stops (`R6-24`): played
 * already, playing now, or not reached yet.
 */
export const STEP_STATE = {
  DONE: "done",
  CURRENT: "current",
  PENDING: "pending"
} as const;

export type StepState = (typeof STEP_STATE)[keyof typeof STEP_STATE];

/** One i18n key per state (`S21` — a rendered name is a key, never a literal). */
export const STEP_STATE_LABELS: Record<StepState, string> = {
  [STEP_STATE.DONE]: "labs.scenario_step_done",
  [STEP_STATE.CURRENT]: "labs.scenario_step_current",
  [STEP_STATE.PENDING]: "labs.scenario_step_seek"
};

/** The glyph a state carries — the state is legible without reading its tooltip. */
export const STEP_STATE_ICONS: Record<StepState, string> = {
  [STEP_STATE.DONE]: "check",
  [STEP_STATE.CURRENT]: "play",
  [STEP_STATE.PENDING]: "circle"
};

export type ScenarioPaneProps = {
  /** The page's own declaration, as `ts` source — drawn as a fence on Live. */
  declaration: string;
  /**
   * The playlist behind the page, verbatim Gherkin, reaching app runtime
   * through the `ESC6` seam (`modules/scenarios/runtime/force/corpus.source.ts`
   * — `featureText`). It is `""` while that escalation is unruled, which is the
   * pane's empty state: no playlist, no tracks, Live alone (`S12`).
   */
  featureText?: string;
  /** The armed track's name; on Live there is none and the whole playlist is drawn. */
  trackName?: string;
  /**
   * The armed track's own stops, in run order — the SAME scenes the bar's scene
   * rail scrubs, so the two views cannot disagree about which stop is which
   * (`R6-24`). Absent on Live.
   */
  scenes?: readonly TrackScene[];
  /**
   * The armed track's declared scope, drawn on the track itself so a greyed
   * actor row and a playable track never silently disagree (design §7.5,
   * `ESC5`).
   */
  trackScope?: ScopeConfig;
  /**
   * The stop the player is at — an index into {@link ScenarioPaneProps.scenes},
   * `-1` while nothing has run. It is an INDEX rather than a line because a
   * Background's steps are prefixed to every scenario it governs, so a line
   * alone names one row per track rather than one row.
   */
  playhead?: number;
  /**
   * Jumps the whole page to stop `index` — the player's own `seek`, which
   * replays from scene 0, exactly as the scene rail does. Absent on Live, where
   * there is nothing to seek in.
   */
  seek?: (index: number) => void;
};
