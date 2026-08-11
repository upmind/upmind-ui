/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * `ScenarioPresentation` node exists anywhere in the tree; it is minted once in
 * `runtime/scenario.types.ts` and consumed here rather than re-declared. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ModuleRenderer.types
 * @description Type definitions for ModuleRenderer — the archetype dispatcher.
 */

import type { ScenarioPresentation } from "../scenario.types";
import type {
  CompositionPort,
  ModuleDescriptor
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export type ModuleRendererProps<K extends string = string> = {
  /** The reflected IR — read-only; `descriptor.archetype.archetype` is the one dispatch key. */
  descriptor: ModuleDescriptor<K>;
  /** The live seam port the descriptor was reflected from — actions + optional table channel. */
  port: CompositionPort;
  /** How the scenario declared itself DRAWN — relayed, never interpreted here. */
  presentation?: ScenarioPresentation;
};
