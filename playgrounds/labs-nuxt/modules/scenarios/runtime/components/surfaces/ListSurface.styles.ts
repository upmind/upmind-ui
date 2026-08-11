import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ListSurface.styles
 * @description CVA configuration for ListSurface.
 *
 * The table draws in the ui `Table` primitives' OWN gutters, borders and
 * alignment — nothing here re-states them. The card is the manage/billing
 * card's layout law (`client-vue/src/components/manage/Item.vue`, as the account
 * profile's `EmailItem.vue` draws it): a full-width stack, `gap-1`, the title
 * carrying its badges, one muted line under it, the actions in the header.
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

/**
 * The star EVERY row carries, in the marker column and in the card's own lead:
 * the flagged row accented, the rest quiet, so the column reads as one choice
 * among many.
 */
export const rowMarker = cva("", {
  variants: {
    isMarked: {
      true: "text-accent-primary",
      false: "text-muted"
    }
  },
  defaultVariants: { isMarked: false }
});

/**
 * The same per-call treatment for a HEADER cell, whose variant is the column's
 * own. A sortable header draws its label inside a `sm` Button, so the cell gives
 * back exactly the padding that button adds and the header lands on the same
 * text edge as the data beneath it.
 */
export const headerCell = cva("", {
  variants: {
    isSortable: {
      true: "px-2",
      false: ""
    }
  },
  defaultVariants: { isSortable: false }
});

/**
 * The card, at the manage card's rhythm — `Card`'s own `p-6 lg:p-12` is a page
 * card's padding, and both breakpoints have to be named to bring it down.
 */
export const dataCard = cva(
  "col-span-12 flex w-full flex-col gap-1 p-4 lg:p-4",
  {
    variants: {
      isMarked: {
        true: "border-accent-primary border",
        false: ""
      }
    },
    defaultVariants: { isMarked: false }
  }
);

export default {
  listSurface: {
    root: cva("space-y-4"),

    toolbar: cva("flex flex-wrap items-end gap-3"),

    // The bar takes the row's slack so the controls after it land on the right
    // edge, and keeps enough width to stay usable before the row wraps.
    toolbarFilters: cva("min-w-64 flex-1"),

    toolbarControls: cva("ml-auto flex items-center gap-2"),

    sortControl: cva("text-muted"),

    cellContent: cva("flex flex-wrap items-center gap-2"),

    // Header-less and shrink-to-fit, so the marker sits at the row's left edge
    // and the first data column keeps the gutter it would have had.
    markerCell: cva("w-px pr-0"),

    // Shrink-to-fit, so the last column ends at the row's right edge instead of
    // taking an equal share of it and leaving the controls stranded mid-table.
    actionsCell: cva("w-px whitespace-nowrap"),

    skeletonCell: cva("h-4 w-full"),

    skeletonMarker: cva("size-4"),

    skeletonActions: cva("ml-auto h-8 w-20"),

    cardGrid: cva("grid w-full grid-cols-12 gap-2"),

    cardHeader: cva("flex w-full items-start justify-between gap-2"),

    // The card's own marker column: the star leads the title instead of sitting
    // inside it, the same law the table's first column draws.
    cardLead: cva("flex min-w-0 items-center gap-2"),

    cardTitle: cva("text-md m-0 flex items-center gap-x-2 font-medium"),

    cardSubtitle: cva("text-muted m-0 text-sm"),

    cardBody: cva("flex flex-wrap items-center gap-2"),

    skeletonCard: cva("h-5 w-full"),

    rowList: cva("space-y-2"),

    rowListItem: cva(
      "border-surface flex items-center justify-between gap-2 border-b p-2"
    ),

    rowListFields: cva("flex flex-wrap items-center gap-3 text-sm"),

    rowListField: cva("text-muted flex items-center gap-2")
  }
};
