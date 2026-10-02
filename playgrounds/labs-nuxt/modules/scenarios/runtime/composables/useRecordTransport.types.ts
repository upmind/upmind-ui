// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useRecordTransport.types
 * @description What a record page hands its route-param transport, and what it
 * gets back: the subject the page draws, a port that always reads the cell on
 * screen, and the world the scenario player boots through.
 *
 * Nothing is minted that already exists: `ModulePort` is the one port shape,
 * `FourLayerComposable` the declaration's builder, `UseScenarioPlayer` the
 * transport's own contract and `World` the harness's execution seam.
 */

import type { ModulePort } from "./useModulePort.types";
import type { UseScenarioPlayer } from "./useScenarioPlayer.types";
import type { FourLayerComposable, ScenarioKey } from "../scenario.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { World } from "@upmind-automation/scenario-harness";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

export type RecordTransportSource = {
  /** The scenario key the page renders — the one key the world adopts. */
  key: ScenarioKey;
  /** The manager the declaration boots for one record (`useManage`). */
  composable: FourLayerComposable;
  /** The record the url's route param names; absent, the page boots no cell. */
  id?: string;
  /**
   * The manager addresses the session's own record, never an id: the page boots
   * the cell at the actor alone and draws it at once. `id` is then ignored.
   */
  idless?: boolean;
  /** The actor the url names. */
  actor: ScopeActorTypes;
  /** The declaration's own `actors`, relayed to every cell the page opens. */
  offeredActors?: ScopeActorTypes[];
};

export type RecordTransport = {
  /** The record on screen — the replay's while a track is armed, else the url's. */
  subjectId: ComputedRef<string | undefined>;
  /** A port that always reads the cell for {@link RecordTransport.subjectId}. */
  port: ModulePort;
  /** The page's world, reporting each record a scene boots so the page draws it. */
  world: World;
  /** Hands the page back to the url's record whenever the armed track changes. */
  follow: (player: UseScenarioPlayer) => void;
};
