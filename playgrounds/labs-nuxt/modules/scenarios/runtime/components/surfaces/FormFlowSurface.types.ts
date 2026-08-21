// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/FormFlowSurface.types
 * @description Type definitions for the Form-Flow archetype surface.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * form-flow member-name node exists in the tree; the four names below are the
 * two conventions headless's own Form-Flow modules already drive through
 * (`useAuth`'s flow machine, and the shared `dataManagerMachine` every manager
 * runs on), lifted into an enum rather than repeated as string literals in the
 * surface. The feedback pair is `ScenarioHandoff`'s own, consumed rather than
 * re-declared. See `graphify-out/GRAPH_REPORT.md`.
 */

import type { SurfaceProps } from "./surface.types";
import type { ScenarioHandoff } from "../../scenario.types";

// -----------------------------------------------------------------------------

/**
 * The member names a Form-Flow module is driven through. There is no
 * declaration channel for these (`R6-29`): the surface takes whichever pair the
 * live port actually exposes, so the module's own vocabulary decides and no
 * scenario restates it.
 */
export enum FormFlowActionTypes {
  /** The flow machine's input member — `useAuth`. */
  SET = "set",
  /** The data manager's input member — every `dataManagerMachine` module. */
  INPUT = "input",
  /** The flow machine's save. */
  RESOLVE = "resolve",
  /** The data manager's save. */
  UPDATE = "update"
}

export type FormFlowSurfaceProps = SurfaceProps & {
  /**
   * What the surface SAYS when the save settles — the handoff that opened this
   * editor carries them. Absent, the surface reports nothing but the API's own
   * sentence on a refusal.
   */
  feedback?: ScenarioHandoff["feedback"];
};
