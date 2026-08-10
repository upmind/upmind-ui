// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/surface
 * @description The shape every archetype surface projects from — a plain
 * snapshot to read and the live seam actions to call. Surfaces never see the
 * raw `CompositionPort`/`ModuleDescriptor` — `ModuleRenderer` is the only place
 * those are unpacked.
 */

import type {
  CompositionPort,
  ReflectedSnapshot
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The live, callable action map — never the mere action-name list off `snapshot.actions`. */
export type SurfaceActions = CompositionPort["actions"];

export type SurfaceProps = {
  snapshot: ReflectedSnapshot;
  actions: SurfaceActions;
};
