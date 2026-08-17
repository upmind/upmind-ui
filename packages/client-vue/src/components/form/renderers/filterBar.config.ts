import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/filterBar.config
 * @description CVA configuration for the `FilterBar` layout.
 */

/**
 * One element's share of the bar, called per element rather than resolved
 * through `useStyles`: what a control is owed is a property of the ELEMENT's own
 * declaration, and `useStyles` resolves its variants once against the
 * component's single `meta` object.
 *
 * The growing element takes the bar's slack up to a CAP — the declaration says
 * which control the slack belongs to, this recipe says how much of it a toolbar
 * may hand over. Uncapped, the search runs the full width of a wide viewport
 * and the facets read as stranded at the far end. The cap is the same one the
 * product's own email-search toolbar draws (`EmailHistoryListing`), and it is
 * breakpointed so a narrow bar still fills and wraps exactly as before.
 */
export const filterBarItem = cva("empty:hidden", {
  variants: {
    isGrowing: {
      true: "min-w-48 flex-1 lg:max-w-xl",
      false: "w-auto shrink-0"
    }
  },
  defaultVariants: { isGrowing: false }
});

export default {
  filterBar: {
    root: cva("flex w-full flex-wrap items-end gap-x-3 gap-y-2")
  }
};
