/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `SceneRail` / `SceneRailProps` node exists anywhere in the tree. The scene
 * shape is NOT minted here: it is the harness's own published `FeatureStep`
 * (`packages/scenario-harness`, `steps.types.ts`), which is what a parsed
 * feature already hands out and what `useFeatureTracks` (T4.1) binds a `run`
 * onto — so a track's scenes pass straight through with no second shape. The
 * rail's own drawing is `@upmind-automation/upmind-ui`'s `Stepper`. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SceneRail.types
 * @description Type definitions for the scene rail — the armed track's own
 * Gherkin steps, drawn as the scrubber the playhead moves along.
 */

import type { FeatureStep } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export type SceneRailProps = {
  /**
   * The armed track's scenes, in the order the feature declares them — a scene
   * IS a step (`F-round`). A richer scene (T4.1's, carrying its bound `run`)
   * passes through unchanged; the rail reads only what it draws.
   */
  scenes: readonly FeatureStep[];
};
