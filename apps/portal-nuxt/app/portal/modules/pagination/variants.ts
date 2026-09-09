// -----------------------------------------------------------------------------
/**
 * @module portal/modules/pagination/variants
 * @description The footer row's own measurements, named once here rather than
 * spelled into the template (the folder convention: `cva` is a
 * `design-system/packages/ui` dependency, not this app's).
 */

/** The page size sits at one end of the row, the arrows at the other. */
export const PAGER_ROW_CLASS =
  "flex flex-wrap items-center justify-between gap-2";

/** Two digits and a caret — the narrowest trigger the control family offers. */
export const PAGE_SIZE_SELECT_CLASS = "w-24";
