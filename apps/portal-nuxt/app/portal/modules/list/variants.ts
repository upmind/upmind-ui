// -----------------------------------------------------------------------------
/**
 * @module portal/modules/list/variants
 * @description `masonry`'s column-count override (ui-gaps.md) — the one look
 * that varies by prop in this folder. `cva` is a `design-system/packages/ui`
 * dependency, not this app's (COMPONENT_SPEC.md § dependencies) — a plain
 * lookup covers one variant dimension without adding one here (mirrors
 * `content/variants.ts`'s `rowFullMeasureClass`).
 *
 * `ListRoot`'s own `masonry` layout keys its column count off the VIEWPORT
 * (`sm:`/`lg:` Tailwind breakpoints), not the width of whatever container
 * actually hosts it (`design-system/packages/ui/src/components/list/variants.ts`,
 * ui-gaps.md) — the same root cause `StatGroup`'s `columns` prop already
 * mitigates for `Metric`. `ListRoot` carries no such prop, so a caller narrower
 * than its own breakpoint pins EVERY Tailwind breakpoint slot to the same
 * column count, overriding the viewport-keyed default regardless of width.
 */

import type { ListModuleColumns, ListModuleMedia } from "./types";

const MASONRY_COLUMNS_CLASS: Readonly<Record<ListModuleColumns, string>> = {
  1: "columns-1 sm:columns-1 lg:columns-1",
  2: "columns-1 sm:columns-2 lg:columns-2",
  3: "columns-1 sm:columns-2 lg:columns-3",
  4: "columns-1 sm:columns-2 lg:columns-4"
};

/**
 * The CSS multi-column flow itself. `ListRoot` used to carry it as a `layout`
 * variant and no longer does, so the module supplies it: `block` beats the
 * root's own `flex` in tailwind-merge (a flex container ignores `columns`),
 * and items fill column 1 top-to-bottom before column 2, so they read
 * DOWN-then-across rather than across-then-down.
 */
const MASONRY_FLOW_CLASS = "block gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid";

/** The viewport-keyed default, for a caller that names no column count. */
const MASONRY_DEFAULT_COLUMNS_CLASS = "columns-1 sm:columns-2 lg:columns-3";

export function masonryClass(columns: ListModuleColumns | undefined): string {
  if (columns === undefined) {
    return `${MASONRY_FLOW_CLASS} ${MASONRY_DEFAULT_COLUMNS_CLASS}`;
  }
  return `${MASONRY_FLOW_CLASS} ${MASONRY_COLUMNS_CLASS[columns]}`;
}

/** `cards` — a real grid, so each card is a track-sized block rather than flowing content. */
const CARD_GRID_CLASS: Readonly<Record<ListModuleColumns, string>> = {
  1: "grid grid-cols-1 gap-4",
  2: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  3: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid grid-cols-2 gap-4 lg:grid-cols-4"
};

export function cardGridClass(columns: ListModuleColumns | undefined): string {
  return CARD_GRID_CLASS[columns ?? 3];
}

/** `carousel` — the same cards on one scrolling strip: fixed-width tracks, overflow scrolls, never wraps. */
export const CARD_CAROUSEL_CLASS =
  "flex gap-4 overflow-x-auto pb-2 [&>*]:w-72 [&>*]:shrink-0";

/** `cards` — the media block's shape, per the option the config picks. */
const CARD_MEDIA_CLASS: Readonly<Record<ListModuleMedia, string>> = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-3/4",
  banner: "h-36"
};

export function cardMediaClass(media: ListModuleMedia | undefined): string {
  return CARD_MEDIA_CLASS[media ?? "video"];
}

/**
 * The ruled stack is a container query root: its rows key off the width the
 * list actually has (a 20rem rail, a phone), not the viewport's.
 */
export const STACK_ROOT_CLASS = "@container";

/**
 * A row's trailing cluster — badges, the action, the menu — drops onto its own
 * line under the text where the list is narrower than 24rem. On one line it
 * would take the width it needs and leave the title nothing to truncate into.
 */
export const STACK_ITEM_CLASS =
  "flex-wrap @max-sm:[&>[data-slot=list-item-trailing]]:basis-full @max-sm:[&>[data-slot=list-item-trailing]]:justify-end";

/** A row's category, on its own line over the title it qualifies. `block`, so a long one truncates inside the row instead of pushing past it — a flex badge cannot ellipsise. */
export const STACK_CATEGORY_CLASS = "mb-1 block max-w-full truncate";

/** A card's badge line: the category at the start, the status pushed to the end. */
export const CARD_BADGE_ROW_CLASS = "mb-1 flex flex-wrap items-center gap-2";

/** The cluster itself wraps too — two tags and an action rarely share one narrow line. */
export const STACK_TRAILING_CLASS =
  "flex flex-wrap items-center justify-end gap-2";

/** `row-cards` — the same container query, on the column of cards. */
export const ROW_CARDS_ROOT_CLASS = "@container flex flex-col gap-3";

export const ROW_CARD_CLASS =
  "rounded-card border-stroke bg-surface flex flex-wrap items-center gap-4 border p-4";

/** A card's trailing cluster, on its own line under 24rem for the same reason as a row's. */
export const ROW_CARD_TRAILING_CLASS =
  "flex shrink-0 flex-wrap items-center justify-end gap-2 @max-sm:basis-full";

/** A table cell never breaks a date or an amount across lines — the table scrolls sideways inside its container instead. */
export const TABLE_CELL_CLASS = "whitespace-nowrap";

/** A group's header row: quieter and tighter than the rows it heads, since it is a label, not an entry. */
export const GROUP_HEADER_CLASS = "bg-neutral-muted/40 py-1.5";

/** Its collapse control — the whole label is the target, so the chevron and the words move together. */
export const GROUP_TOGGLE_CLASS =
  "text-muted flex w-full items-center gap-2 text-left text-sm font-medium";

/** A masked secret reads as a fixed run of bullets — never the value's own length, which leaks it. */
export const SECRET_MASK = "••••••••";

/** The row-level control cluster a secret or a toggle adds beside the text. */
export const ROW_CONTROLS_CLASS = "flex shrink-0 items-center gap-1";

/** A timeline event's top line — its time, and its own menu pushed to the end. */
export const TIMELINE_EVENT_HEAD_CLASS =
  "flex items-start justify-between gap-2";

/** A revealed secret is a value to read exactly, so it wears the tabular face amounts and ids do. */
export const SECRET_VALUE_CLASS = "type-data";
