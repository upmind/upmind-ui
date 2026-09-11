// -----------------------------------------------------------------------------
/**
 * @module portal/modules/pagination/variants
 * @description The footer row's own measurements, named once here rather than
 * spelled into the template (the folder convention: `cva` is a
 * `design-system/packages/ui` dependency, not this app's).
 */

/** The page size sits at one end of the row, the arrows at the other — full width, so a flex-row footer gives it the room. */
export const PAGER_ROW_CLASS =
  "flex w-full flex-wrap items-center justify-between gap-2";

/** The library's nav is `w-full`, which would take the whole row; a shrink-wrapped cell at the end keeps it beside the page size. */
export const PAGER_END_CLASS = "ms-auto";

/** Two digits and a caret — the narrowest trigger the control family offers. */
export const PAGE_SIZE_SELECT_CLASS = "w-24";
