// -----------------------------------------------------------------------------
/**
 * @module factory/ModuleRenderer
 * @description Type definitions for ModuleRenderer — the archetype dispatcher
 * (design.md FE-2977 §Block C).
 */

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
};
