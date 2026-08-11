import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/filterRow.config
 * @description CVA configuration for the flowing filter row.
 */

/**
 * One element's share of the row, called per element rather than resolved
 * through `useStyles`: what a control is owed is a property of the ELEMENT's own
 * declaration, and `useStyles` resolves its variants once against the
 * component's single `meta` object.
 */
export const filterRowItem = cva("empty:hidden", {
  variants: {
    isGrowing: {
      true: "min-w-48 flex-1",
      false: "w-auto shrink-0"
    }
  },
  defaultVariants: { isGrowing: false }
});

export default {
  filterRow: {
    root: cva("flex w-full flex-wrap items-end gap-x-3 gap-y-2")
  }
};
