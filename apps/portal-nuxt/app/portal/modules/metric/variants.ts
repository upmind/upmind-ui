// -----------------------------------------------------------------------------
/**
 * @module portal/modules/metric/variants
 * @description The `tile` variant's grid — one look that varies by prop, as a
 * plain lookup (mirrors `list/variants.ts`; `cva` is a design-system
 * dependency, not this app's).
 */

import type { MetricModuleColumns } from "./types";
// -----------------------------------------------------------------------------

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
 * One tile's own look, worn by both forms.
 *
 * The linked form used to be the DS `Link`, whose base carries `rounded-xs`.
 * `cn()` calls bare `twMerge`, which does not know the custom `rounded-card`
 * token, so BOTH radii survived the merge and the emitted CSS order decided —
 * a linked tile rendered at 2px against the panels' 12px. The tile is a plain
 * link now, so nothing competes.
 */
const TILE_CLASS = "rounded-card bg-neutral-muted block p-6 no-underline";

/** What a tile that GOES somewhere adds — the chrome the DS `Link` used to bring. */
const TILE_LINK_CLASS =
  "cursor-pointer transition-colors hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/40";

/** A tile that names no destination stays inert: no pointer, no hover fade. */
export function tileClass(isLinked: boolean): string {
  if (!isLinked) return TILE_CLASS;
  return `${TILE_CLASS} ${TILE_LINK_CLASS}`;
}
