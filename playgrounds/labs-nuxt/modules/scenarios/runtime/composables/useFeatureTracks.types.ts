/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-11, 6795 nodes) — no
 * `FeatureTrack` / `TrackScene` / `useFeatureTracks` / playlist node exists
 * anywhere in the tree (every `Track` match belongs to the storefront's
 * analytics specs), so this contract is minted rather than consumed. What it
 * DOES consume is named rather than re-spelt: `FeatureStep`, `StepKind`,
 * `StepCatalog` and `MalformedStepDef` are the harness's own step contract, and
 * `World` / `WorldScope` are its execution seam. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useFeatureTracks.types
 * @description The playlist shape the page plays — a feature's scenarios as
 * TRACKS and their steps as SCENES (design §3.1). One contract for the three
 * consumers: the bar renders tracks, the rail scrubs scenes, the player arms a
 * track and runs its scenes against the live `World`.
 */

import type {
  FeatureStep,
  MalformedStepDef,
  StepCatalog,
  World,
  WorldScope
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * What a page declares to have a playlist at all — the scenario declaration's
 * own `tracks` channel is one (design §3.2), so it can be handed over whole.
 */
export type FeatureTracksSource = {
  /**
   * The feature's Gherkin TEXT, reached through the corpus seam
   * (`force/corpus.source.ts`, `ESC6`). Empty until that ruling lands, which
   * yields zero tracks and leaves the page Live-only (`S12`).
   */
  feature: string;
  /**
   * The module's ONE step catalog — the same `defineSteps` catalog the
   * Playwright lane registers, never a playground copy of it.
   */
  catalog: StepCatalog;
};

/**
 * One step of a track, bound to the catalog handler that matched its text.
 * `line` is what the Scenario pane marks as the playhead moves (`AC2.7`).
 */
export type TrackScene = FeatureStep & {
  /** False when NO catalog pattern matches this step — the track cannot play. */
  isMatched: boolean;
  /** The args cucumber compiled from this step's own text; empty for an unmatched one. */
  args: ReadonlyArray<string | number>;
  /**
   * The matched handler's own SOURCE — what this step executes, printed by the
   * Code pane while the track is armed so the snippet is the scenario's real
   * calls rather than the page's generic list call (`R6-20`). Absent for an
   * unmatched step, which executes nothing.
   */
  source?: string;
  /**
   * Runs this scene against the live world: the matched handler, called with
   * the args cucumber compiled from the step's own text.
   *
   * @throws for an unmatched scene — a step the catalog cannot run is refused
   * out loud, never skipped to keep a track moving.
   */
  run(world: World): Promise<void>;
};

/** One scenario of the playlist: what the bar lists and the player arms. */
export type FeatureTrack = {
  /** The scenario's own name, verbatim — an Examples row carries its substituted name. */
  name: string;
  /** The value `track=` carries (design §3.4); unique across the playlist. */
  slug: string;
  /** The scenario's own `@`-prefixed tags; feature-level tags are not inherited. */
  tags: readonly string[];
  /** The line the scenario (or its Examples row) is declared on. */
  line: number;
  /**
   * The scope this track DECLARES, read off the scope its own arrangement boots
   * at — what the player compares against the page's current scope before
   * arming, and navigates to on a mismatch (design §3.1 ruling 2). Absent when
   * the arrangement boots nothing, which means the track plays against whatever
   * scope the page is already showing.
   */
  scope?: WorldScope;
  /** Every step, in run order, Background steps first. */
  scenes: readonly TrackScene[];
  /** False when any scene is unmatched — the track is listed, but refuses to arm. */
  isPlayable: boolean;
};

export type UseFeatureTracks = {
  /** The feature's scenarios in document order; empty for an empty playlist. */
  tracks: readonly FeatureTrack[];
  /**
   * Catalog patterns that failed to compile as cucumber expressions. Their
   * steps surface as unmatched scenes; this says the catalog is at fault, not
   * the feature.
   */
  malformedStepDefs: readonly MalformedStepDef[];
};
