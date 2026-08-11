/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `ScenarioPresentation` / `ResolvedHandoff` node exists anywhere in the tree;
 * both are minted once in `runtime/scenario.types.ts` and consumed here rather
 * than re-declared. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ModuleRenderer.types
 * @description Type definitions for ModuleRenderer — the archetype dispatcher.
 */

import type { ModulePort } from "../composables/useModulePort.types";
import type { ResolvedHandoff, ScenarioPresentation } from "../scenario.types";
import type { ModuleDescriptor } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export type ModuleRendererProps<K extends string = string> = {
  /** The reflected IR — read-only; `descriptor.archetype.archetype` is the one dispatch key. */
  descriptor: ModuleDescriptor<K>;
  /**
   * The live port the descriptor was reflected from, as the ONE builder
   * publishes it (`useModulePort`) — the seam `CompositionPort` widened by the
   * criteria and debug branches the raw-cell holder relays. Typed at the
   * builder's surface, never re-narrowed to the frozen core shape, or the
   * criteria a list surface is handed cannot be named.
   */
  port: ModulePort;
  /** How the scenario declared itself DRAWN — relayed, never interpreted here. */
  presentation?: ScenarioPresentation;
  /** The scenario's declared handoffs, already resolved to their targets — relayed. */
  handoffs?: Record<string, ResolvedHandoff>;
};
