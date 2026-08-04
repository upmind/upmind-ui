import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/ListSurface.styles
 * @description CVA configuration for ListSurface.
 */

export default {
  listSurface: {
    root: cva("space-y-4"),

    collectionActions: cva("flex justify-end"),

    table: cva("w-full text-left text-sm"),

    headerCell: cva("border-surface border-b p-2 align-top font-semibold"),

    sortButton: cva("flex items-center gap-1"),

    filterLabel: cva("mt-1 block"),

    filterLabelText: cva("sr-only"),

    dataCell: cva("border-surface border-b p-2"),

    rowList: cva("space-y-2"),

    rowListItem: cva(
      "border-surface flex items-center justify-between gap-2 border-b p-2"
    ),

    rowListFields: cva("flex flex-wrap gap-3 text-sm"),

    rowListField: cva("text-muted")
  }
};
