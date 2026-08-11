import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ListSurface.styles
 * @description CVA configuration for ListSurface.
 *
 * The table draws in the ui `Table` primitives' OWN borders and alignment; what
 * `table` restates is only what a data table needs the page-card rhythm not to
 * decide — the row's height and the marker column's gutter. The card is the
 * manage/billing card's layout law (`client-vue/src/components/manage/Item.vue`,
 * as `billing/components/AddressItem.vue` draws it): a stack at `gap-1`, the
 * title carrying its badges inline, one muted line under it, the actions in the
 * header.
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
    },
    // An outcome outranks the marker — declared after it, so the tint that
    // answers what the user just did is the one tailwind-merge keeps.
    isSucceeded: {
      true: "bg-accent-success-muted text-accent-success-muted-contrast",
      false: ""
    },
    // The row keeps NO bottom rule of its own: the strip beneath it belongs to
    // it, and a line between them would make two rows out of one record (F4).
    isFailed: {
      true: "bg-accent-danger-muted text-accent-danger-muted-contrast border-b-0",
      false: ""
    }
  },
  defaultVariants: {
    isMarked: false,
    isSucceeded: false,
    isFailed: false
  }
});

/**
 * The star EVERY row carries, in the marker column and in the card's own lead:
 * the flagged row accented, the rest quiet, so the column reads as one choice
 * among many. `block` because the ui Icon is an inline `<i>`, which would
 * otherwise sit on the cell's text baseline instead of its middle.
 */
export const rowMarker = cva("block", {
  variants: {
    isMarked: {
      true: "text-accent-primary",
      false: "text-muted"
    }
  },
  defaultVariants: { isMarked: false }
});

/**
 * The card, at the manage card's rhythm — `Card`'s own `p-6 lg:p-12` is a page
 * card's padding, and both breakpoints have to be named to bring it down. It
 * fills its grid cell and centres its own stack, so a card with fewer declared
 * lines than its neighbours reads balanced rather than top-hung.
 */
export const dataCard = cva(
  "flex h-full w-full flex-col justify-center gap-1 p-4 lg:p-4",
  {
    variants: {
      isMarked: {
        true: "border-accent-primary border",
        false: ""
      },
      isSucceeded: {
        true: "border-accent-success bg-accent-success-muted border",
        false: ""
      },
      isFailed: {
        true: "border-accent-danger bg-accent-danger-muted border",
        false: ""
      }
    },
    defaultVariants: {
      isMarked: false,
      isSucceeded: false,
      isFailed: false
    }
  }
);

/**
 * The read-only list's own row, which carries its verdict inline rather than in
 * a row of its own — the table's sub-row has no equivalent in a `<ul>`.
 */
export const rowListItem = cva(
  "border-surface flex flex-wrap items-center justify-between gap-2 border-b p-2",
  {
    variants: {
      isFailed: {
        true: "bg-accent-danger-muted text-accent-danger-muted-contrast",
        false: ""
      }
    },
    defaultVariants: { isFailed: false }
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

    // The whole table's rhythm, in one place so the header, the data rows, the
    // skeleton and the empty frame are measured the same way.
    // · `py-2` is the compact row — the ui TableCell's own `p-4` is a page
    //   card's rhythm and doubles every row's height.
    // · with a marker column the SECOND cell gives back most of its gutter, so
    //   the star leads its row at the card lead's own `gap-2` instead of
    //   floating a full gutter away from the title.
    table: cva("[&_td]:py-2", {
      variants: {
        hasMarker: {
          true: "[&_td:nth-child(2)]:pl-2 [&_th:nth-child(2)]:pl-2",
          false: ""
        }
      },
      defaultVariants: { hasMarker: false }
    }),

    // Every declared column takes an equal share of what the two shrink-to-fit
    // columns leave, so a sort that swaps the page's rows cannot resize a
    // column: the widths are reserved by the frame, never measured off the data.
    headerCell: cva("w-full"),

    // A sortable header draws its label inside a `sm` Button; the button's own
    // inset is given back so the header's text lands on the very same edge as
    // the cell beneath it and as the headers that carry no control.
    sortControl: cva("text-muted -ml-2.5"),

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

    // Small records read three across on a desktop and collapse from there,
    // never one card per row.
    cardGrid: cva("grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3"),

    cardHeader: cva("flex w-full items-start justify-between gap-2"),

    // The card's own marker column: the star leads the title instead of sitting
    // inside it, the same law the table's first column draws.
    cardLead: cva("flex min-w-0 items-center gap-2"),

    cardTitle: cva(
      "text-md m-0 flex flex-wrap items-center gap-x-2 font-medium"
    ),

    // A declared slot whose row has nothing to put in it takes no space: its
    // line height would otherwise read as a gap the card never asked for.
    cardSubtitle: cva("text-muted m-0 text-sm empty:hidden"),

    cardBody: cva("flex flex-wrap items-center gap-2 empty:hidden"),

    skeletonCard: cva("h-5 w-full"),

    // The failed row and the strip under it are ONE record in an error state:
    // the strip carries the same tint and closes the pair with the row border,
    // so the next row can never read as part of the failure (F4).
    failureRow: cva("bg-accent-danger-muted"),

    failureCell: cva("py-0 pb-2"),

    rowList: cva("space-y-2"),

    rowListFields: cva("flex flex-wrap items-center gap-3 text-sm"),

    // A full-width line of its own, under the row it belongs to.
    rowListFailure: cva("w-full"),

    rowListField: cva("text-muted flex items-center gap-2")
  }
};
