/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-11, 6795 nodes) — no
 * player, playhead, transport-state or scrubber node exists anywhere in the
 * tree (the one `transport` match is the integration lane's
 * `assertClientIdentityTransport`), so the transport contract is minted. What it
 * does NOT mint: `FeatureTrack` is T4.1's playlist shape, `World` / `WorldScope`
 * the harness's execution seam, `ModulePortCriteria` the port's own request
 * state, and `PlaygroundUrlState` / `UseForcedState` the url writer and the
 * worker handle this composable drives. Re-queried 2026-08-12 over the same
 * `graphify-out/graph.json` for a transport FAILURE shape (`fail*` labels): the
 * four matches are `fail()` / `failClosed()` / `.failedAction()`, all unrelated
 * helpers, so `FAILED` joins the status set already declared here rather than
 * minting a second one, and `failure` carries the thrown reason as `unknown`
 * rather than a shape of its own. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioPlayer.types
 * @description What a track is played THROUGH — the transport's own state, and
 * the page seams it drives (design §3.1).
 */

import type { FeatureTrack } from "./useFeatureTracks.types";
import type { UseForcedState } from "./useForcedState.types";
import type { ModulePortCriteria } from "./useModulePort.types";
import type { PlaygroundUrlState } from "../../../../app/composables/usePlaygroundUrlState.types";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

/**
 * Where the transport is. `LIVE` is the state the page boots into — the real
 * interactive page, no track armed and no transport offered (`S12`/`AC2.3`);
 * `ARMED` is a track chosen with no scene run yet; `PAUSED` is a track part-way
 * through (or finished), which is also where a played-out track lands; `FAILED`
 * is a scene that THREW, said out loud rather than left as a bar that has
 * quietly stopped moving (`S14`).
 */
export const SCENARIO_PLAYER_STATUS = {
  LIVE: "live",
  ARMED: "armed",
  PLAYING: "playing",
  PAUSED: "paused",
  FAILED: "failed"
} as const;

export type ScenarioPlayerStatus =
  (typeof SCENARIO_PLAYER_STATUS)[keyof typeof SCENARIO_PLAYER_STATUS];

/** The playhead of an armed track no scene of which has run yet. */
export const SCENE_UNPLAYED = -1;

/**
 * What the page hands its player. Everything below `criteria` is a SEAM with a
 * page default: the composable resolves the page's own url writer, worker,
 * world, scope and router unless it is handed them.
 */
export type ScenarioPlayerSource = {
  /** The page's playlist (T4.1). Empty leaves the page Live-only. */
  tracks: readonly FeatureTrack[];
  /**
   * The port's request state, absent for a cell that owns none. Its value when
   * the player is created IS the boot state every arm and every replay returns
   * to, so a filter a scene set cannot leak into the next run.
   */
  criteria?: ModulePortCriteria;
  /** The in-page world scenes run against; the page's own by default. */
  world?: World;
  /** The worker handle the `replay` preset is armed through. */
  forced?: UseForcedState;
  /** The one query-string writer — `track=` and `scene=` are written through it. */
  url?: PlaygroundUrlState;
  /**
   * The scope the page is CURRENTLY showing, resolved as the port that renders
   * it was built (`self` resolved to the session's own actor), which is what a
   * track's declared scope is compared against before it may arm.
   */
  scope?: () => WorldScope;
  /**
   * Takes the page to a scope — a path segment, so the page remounts (`P1-R2`)
   * and mounts that cell itself. Defaults to a router push of the track's scope
   * path with the current query carried through.
   */
  navigate?: (scope: WorldScope) => Promise<void>;
  /**
   * Milliseconds a played scene holds the screen before the next one runs. The
   * page's default is a beat a person can watch and interrupt; `0` runs the
   * track as fast as it will go, which is what a test wants and what a viewer
   * never does.
   */
  dwell?: number;
};

export type UseScenarioPlayer = {
  /** The armed track — absent on Live. */
  track: ComputedRef<FeatureTrack | undefined>;
  status: ComputedRef<ScenarioPlayerStatus>;
  /** The scene the surface is at; {@link SCENE_UNPLAYED} while nothing has run. */
  playhead: ComputedRef<number>;
  /** A scene (or an arm) is in flight — what the control that was clicked reads (`E12`/`S14`). */
  isBusy: ComputedRef<boolean>;
  /**
   * Why the last job stopped, `undefined` while nothing has failed. Every
   * caller discards the promise a control hands back, so a thrown scene is
   * surfaced HERE rather than as an unhandled rejection nobody sees (`S14`).
   * Cleared when the next job starts, because a failure belongs to the job that
   * raised it.
   */
  failure: ComputedRef<unknown>;
  /**
   * Whether a track can be played AT ALL. False while the recorded corpus
   * cannot reach app runtime (`ESC6`), where a track would replay against
   * staging — and its scenes write.
   */
  isAvailable: boolean;
  /**
   * Arms a track: the `replay` preset BEFORE any scene runs, the playhead back
   * to {@link SCENE_UNPLAYED} and the criteria back to boot state.
   *
   * A track declaring a scope the page is not showing NAVIGATES there first and
   * arms from the url on the other side — `world.boot` is never called on a
   * scope the page is not showing (design §3.1 ruling 2).
   *
   * Refused, silently, for a track that cannot play — an unmatched scene, or a
   * corpus that cannot answer ({@link UseScenarioPlayer.isAvailable}).
   */
  arm: (track: FeatureTrack) => Promise<void>;
  /** Runs the armed track's remaining scenes in declared order, awaiting each. */
  play: () => Promise<void>;
  /** Stops after the scene in flight; the track stays armed at its playhead. */
  pause: () => void;
  /** Runs exactly one scene. */
  next: () => Promise<void>;
  /** {@link UseScenarioPlayer.seek} to the scene before — a REPLAY, not a step back. */
  prev: () => Promise<void>;
  /**
   * Puts the surface at scene `index` by REPLAYING the track from scene 0 up to
   * it: a step is an imperative call on a live composable and nothing can
   * un-fire one (design §3.1 ruling 1).
   */
  seek: (index: number) => Promise<void>;
  /** Disarms back to Live: no preset, no track, criteria back to boot state. */
  stop: () => Promise<void>;
  /** Resolves once every queued call has run, an arm still in flight included. */
  whenSettled: () => Promise<void>;
};
