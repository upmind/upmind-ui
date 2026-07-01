// -----------------------------------------------------------------------------
/**
 * @module inspector/useInspector.types
 * @description Type definitions for the global inspector registry.
 */

import type { InspectorSection } from "./inspector.types";

// -----------------------------------------------------------------------------

/**
 * Configuration for registering an inspector item.
 */
export type InspectorItemConfig = {
  /** Unique key for this item (used for cleanup). */
  key: string;
  /** Factory function that returns an InspectorSection (allows reactive values). */
  factory: () => InspectorSection;
};

/**
 * Internal registry entry.
 */
export type InspectorItemEntry = {
  /** Unique key for this item. */
  key: string;
  /** Factory function that returns fresh section data. */
  factory: () => InspectorSection;
};
