// -----------------------------------------------------------------------------
/**
 * @module factory/ContextPanel
 * @description Type definitions for ContextPanel — the generalised-Inspector
 * raw context display (design.md FE-2977 §Block C).
 */

// -----------------------------------------------------------------------------

export type ContextPanelItem = {
  key: string;
  value: unknown;
};

export type ContextPanelProps = {
  /** The plain `ModuleDescriptor.snapshot.context` — shown as raw, collapsible entries. */
  context: Record<string, unknown>;
};
