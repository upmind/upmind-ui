import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ListSurface.styles
 * @description CVA configuration for ListSurface.
 */

/**
 * The row's own variant, called per row rather than resolved through
 * `useStyles`: the marker is a property of the ROW, and `useStyles` resolves
 * its variants once against the component's single `meta` object.
 */
export const dataRow = cva("", {
  variants: {
    isMarked: {
      true: "bg-accent-primary-muted text-accent-primary-muted-contrast",
      false: ""
    }
  },
  defaultVariants: { isMarked: false }
});

export default {
  listSurface: {
    root: cva("space-y-4"),

    collectionActions: cva("flex justify-end"),

    table: cva("w-full text-left text-sm"),

    headerCell: cva("border-surface border-b p-2 align-top font-semibold"),

    sortButton: cva("flex items-center gap-1"),

    dataCell: cva("border-surface border-b p-2"),

    rowList: cva("space-y-2"),

    rowListItem: cva(
      "border-surface flex items-center justify-between gap-2 border-b p-2"
    ),

    rowListFields: cva("flex flex-wrap gap-3 text-sm"),

    rowListField: cva("text-muted")
  }
};
