// -----------------------------------------------------------------------------
/**
 * @module factory/MetaPanel
 * @description Type definitions for MetaPanel — the generalised-Inspector
 * meta-flags display (design.md FE-2977 §Block C).
 */

// -----------------------------------------------------------------------------

export type MetaBadgeColor = "success" | "info" | "neutral" | "danger";

export type MetaPanelItem = {
  key: string;
  value: boolean;
  color: MetaBadgeColor;
  variant: "minimal" | "solid";
};

export type MetaPanelProps = {
  /** The already-evaluated flags off `ModuleDescriptor.snapshot.meta`. */
  meta: Record<string, boolean>;
};
