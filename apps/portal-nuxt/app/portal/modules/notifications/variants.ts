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
