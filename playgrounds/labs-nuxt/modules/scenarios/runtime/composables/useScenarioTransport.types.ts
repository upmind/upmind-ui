/**
 * @graphify-citation `graphify query "scenario transport playlist forced state
 * offer player host"` (2026-09-17, `graphify-out/graph.json`, 466 nodes) — no
 * `ScenarioTransport` node exists in the tree, and NOTHING is minted
 * here. Every member below is an existing shape, consumed: `FeatureTrack` is
 * T4.1's playlist shape, `ForcedState` the force offer's, `UseScenarioPlayer`
 * the transport's own contract, `ForceReset` the booted module's cache clear,
 * `ModulePortCriteria` the port's request state, and `World` / `WorldScope` the
 * harness's execution seam. The two aliases are the argument and return BAGS of
 * one function lifted out of `ScenarioPlayground.vue`, which held the same
 * values inline and named none of them. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioTransport.types
 * @description What a page hands its transport, and what it gets back — the
 * playlist, the forced-state offer and the ONE player the scenario bar draws.
 *
 * Nothing is minted that already exists: `FeatureTrack` is the playlist shape,
 * `ForcedState` the offer's, `UseScenarioPlayer` the transport's own, `ForceReset`
 * the booted module's cache clear, `ModulePortCriteria` the port's request state,
 * and `World` / `WorldScope` the harness's execution seam. This file only names
 * the bag the two host surfaces — the shared `ScenarioPlayground` and a
 * self-drawn page — pass through it.
 */

import type { ScenarioTracks } from "../scenario.types";
import type { FeatureTrack } from "./useFeatureTracks.types";
import type { ForcePreset, ForceReset } from "./useForcedState.types";
import type { ModulePortCriteria } from "./useModulePort.types";
import type { UseScenarioPlayer } from "./useScenarioPlayer.types";
import type { ForcedState } from "../force/states.types";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";
import type { ComputedRef, Ref } from "vue";

// -----------------------------------------------------------------------------

/**
 * What a page hands its transport. `module` is the only required member and
 * may be absent — a scenario declaring no `tracks` has no playlist at all,
 * which leaves the bar on Live with no transport (`S12`).
 */
export type ScenarioTransportSource = {
  /**
   * The MODULE whose committed playlist and recordings this page plays
   * (`R6-37`) — the declaration's own `tracks` channel, handed over whole so a
   * paired page's `without` rides with the name it belongs to.
   */
  module?: ScenarioTracks;
  /** The booted port's request state, for the cell that owns one. */
  criteria?: ModulePortCriteria;
  /** The booted module's OWN cache clear, which every arm ends on (FE-3113). */
  reset?: ForceReset;
  /** The world scenes run against; the page's own by default. */
  world?: World;
  /** The scope the page is CURRENTLY showing; the url's by default. */
  scope?: () => WorldScope;
};

/** The transport a page draws its scenario bar and its forced frame from. */
export type ScenarioTransport = {
  /** The module's driveable playlist — empty leaves the page Live-only. */
  tracks: readonly FeatureTrack[];
  /**
   * The module's committed `.feature` text, as the Scenario sheet prints it
   * verbatim. Absent for a page tracking no module, which is a page with no
   * playlist either.
   */
  featureText?: string;
  /** The forced states this page OFFERS, measured off its own recordings. */
  states: Ref<ForcedState[]>;
  /** The page's ONE player (`S19`). */
  player: UseScenarioPlayer;
  /** The preset the forced frame is drawn under, absent on Live. */
  preset: ComputedRef<ForcePreset | undefined>;
  /** The armed forced state, absent on Live. */
  forcedState: ComputedRef<ForcedState | undefined>;
  /** The recorded refusal sentence, only while the refusal preset is armed. */
  forcedRefusal: ComputedRef<string | undefined>;
  /** Whether the page's own controls are the SCRIPT's rather than the operator's (`R6-23`). */
  isLocked: ComputedRef<boolean>;
};
