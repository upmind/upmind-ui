// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/FormFlowSurface.types
 * @description Type definitions for the Form-Flow archetype surface.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) —
 * `ScenarioForm` is minted once in `runtime/scenario.types.ts` and consumed
 * here rather than re-declared.
 */

import type { SurfaceProps } from "./surface.types";
import type { ScenarioForm } from "../../scenario.types";

// -----------------------------------------------------------------------------

export type FormFlowSurfaceProps = SurfaceProps & {
  /**
   * How this scenario's form is DRIVEN — which action takes input, which one
   * saves, and what the save says when it settles. Absent, the archetype's own
   * `set`/`resolve` convention stands and the surface reports nothing.
   */
  form?: ScenarioForm;
};
