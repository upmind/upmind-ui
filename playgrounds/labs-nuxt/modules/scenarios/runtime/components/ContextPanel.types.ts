// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ContextPanel.types
 * @description Type definitions for ContextPanel — the generalised-Inspector
 * raw context display.
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
