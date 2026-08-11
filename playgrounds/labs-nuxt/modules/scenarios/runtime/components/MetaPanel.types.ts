// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/MetaPanel.types
 * @description Type definitions for MetaPanel — the generalised-Inspector
 * meta-flags display.
 *
 * @graphify-citation `graphify query "badge colour variant meta flag"`
 * (2026-08-10) — no `MetaBadgeColor`/`MetaBadgeVariant` node in
 * `graphify-out/graph.json`, and `packages/ui`'s Badge exposes its palette
 * only as a CVA-derived string union (`badge.config.ts`), never an enum. The
 * members below are the subset of that union this panel draws from.
 */

// -----------------------------------------------------------------------------

export enum MetaBadgeColor {
  SUCCESS = "success",
  INFO = "info",
  NEUTRAL = "neutral",
  DANGER = "danger"
}

export enum MetaBadgeVariant {
  MINIMAL = "minimal",
  SOLID = "solid"
}

export type MetaPanelItem = {
  key: string;
  value: boolean;
  color: MetaBadgeColor;
  variant: MetaBadgeVariant;
};

export type MetaPanelProps = {
  /** The already-evaluated flags off `ModuleDescriptor.snapshot.meta`. */
  meta: Record<string, boolean>;
};
