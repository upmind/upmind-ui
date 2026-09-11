// -----------------------------------------------------------------------------
/**
 * @module portal/modules/metric/variants
 * @description The `tile` variant's grid — one look that varies by prop, as a
 * plain lookup (mirrors `list/variants.ts`; `cva` is a design-system
 * dependency, not this app's).
 */

import type { MetricModuleColumns } from "./types";

/** `tile` — a track-sized grid of muted stat tiles. */
const TILE_GRID_CLASS: Readonly<Record<MetricModuleColumns, string>> = {
  1: "grid grid-cols-1 gap-4",
  2: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  3: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid grid-cols-2 gap-4 lg:grid-cols-4"
};

export function tileGridClass(
  columns: MetricModuleColumns | undefined
): string {
  return TILE_GRID_CLASS[columns ?? 2];
}

/**
 * One tile. `block no-underline` is carried for the LINKED form: the DS
 * `Link`'s own base is an underlined `inline-flex` chip, and tailwind-merge
 * keeps the later display and decoration — the focus ring and hover fade
 * stay. Both forms wear the same class, so a linked tile is pixel-identical.
 */
export const TILE_CLASS =
  "rounded-card bg-neutral-muted block p-6 no-underline";
