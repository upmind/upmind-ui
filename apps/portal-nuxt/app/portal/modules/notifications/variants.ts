// -----------------------------------------------------------------------------
/**
 * @module portal/modules/notifications/variants
 * @description The dropdown's own presentation constants. The rail and the
 * panel are the module's look, not a caller's, so they live here rather than
 * as literals in the template (house rule: module styling in `variants.ts`).
 */

/** The rail sits inside a narrow popover, so it takes the library's small size. */
export const FILTER_RAIL_SIZE = "sm";

/** The popover's own measure — the panel is a fixed rail, not the page's width. */
export const PANEL_CLASS = "flex w-80 max-w-full flex-col gap-3";

/**
 * The ROWS' own region, capped and scrolling. Uncapped, the panel grew with
 * the feed — ten accumulated rows stood ~950px tall and filled the viewport.
 * The filter rail above it and the two controls below stay outside, so they
 * are reachable however far down the feed the reader is.
 */
export const FEED_CLASS = "max-h-96 overflow-y-auto";

/** How near the end counts as the end — one row's worth of runway. */
export const FEED_PAGE_DISTANCE = 64;
