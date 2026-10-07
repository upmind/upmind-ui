// -----------------------------------------------------------------------------
/**
 * @module portal/modules/metric/types
 * @description Prop contract for the `metric` module (tasks.md 5.5), over
 * `@upmind/ui`'s `StatGroup`. `StatItem` is already generic (label, value,
 * delta, description) — no further shape is added here.
 */

import type { StatItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

/**
 * One tile. `StatItem` is already generic (label, value, delta, description);
 * `to` is the one thing it cannot express — `Stat` has no link capability at
 * all (ui-gaps.md), so the TILE variant wraps itself in the DS `Link`.
 */
export type MetricModuleItem = StatItem & {
  /** `tile` only — the list this figure counts; absent renders the plain tile. */
  readonly to?: string;
};

export const METRIC_MODULE_VARIANT = {
  /** `StatGroup`'s own bordered card — hairline-divided cells. */
  DEFAULT: "default",
  /**
   * Separate muted tiles, one per stat — the Host·Grid board's metric rail
   * (four grey cards, sentence-case labels). Hand-assembled: `Stat` exposes
   * no label part override, and its `type-label` treatment is the uppercase
   * ledger style, not the tile's own (ui-gaps.md).
   */
  TILE: "tile"
} as const;

export type MetricModuleVariant =
  (typeof METRIC_MODULE_VARIANT)[keyof typeof METRIC_MODULE_VARIANT];

/** `tile` — tiles per row; `default` defers to `StatGroup`'s own breakpoints. */
export type MetricModuleColumns = 1 | 2 | 3 | 4;

export type MetricModuleProps = {
  /** The registered module variant (registry.ts). Absent = `default`. */
  readonly variant?: MetricModuleVariant;
  readonly items: readonly MetricModuleItem[];
  /** Columns at the largest breakpoint; `1` is `tile`-only (`StatGroup` starts at 2). */
  readonly columns?: MetricModuleColumns;
  /** Empty-state heading when `items` is empty (tasks.md 5.6). No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
};
