import { cva } from "class-variance-authority";
import { useInvalidRing } from "@upmind-automation/upmind-ui";
import { TableColumnWidthTypes } from "../../scenario.types";
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
 *
 * A refused record is marked the way a refused input is: the ui's OWN
 * invalid-ring composable, applied rather than re-spelt, so there is one
 * error-outline vocabulary in the product (`H10`/`AC6.3`). It is an outline, so
 * it reserves no space — the row's height and every column's offset are what
 * they were before the refusal (`H6`/`AC6.1`) — and there is no fill anywhere:
 * a wash over the row surface is the treatment the ruling killed (`H8`/`AC6.2`).
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
    // The refused row is a NORMAL row: same surface, same height, same columns,
    // and no ring of its own — the ring belongs to the GROUP that holds the row
    // AND the reason under it ({@link rowGroup}). All it drops is its bottom
    // rule: the strip beneath it belongs to it, and a line between them would
    // make two rows out of one record (`F4`).
    isFailed: {
      true: "border-b-0",
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
 * The refused record's own row GROUP — the `<tbody>` holding the row and the
 * reason strip under it, which is the only element in a table that encloses
 * both, and which Chromium DOES paint an outline around (measured, contrary to
 * the earlier read-back that put the ring on the row and left the message
 * outside it). The ring is the ui vocabulary VERBATIM: an offset of its own
 * would be a second error-outline technique (`H10`/`AC6.3`), which is why
 * `listSurface.table` reserves the standoff the offset needs instead.
 */
/** The ui invalid field's own treatment, applied to the record that carries it. */
const invalidRing = useInvalidRing();

export const rowGroup = cva("", {
  variants: {
    isFailed: {
      true: invalidRing,
      false: ""
    }
  },
  defaultVariants: { isFailed: false }
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
      // The card holds its own strip, so the card IS the record's group: the
      // same ring, on the element that already encloses both (H8).
      isFailed: {
        true: invalidRing,
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
        true: invalidRing,
        false: ""
      }
    },
    defaultVariants: { isFailed: false }
  }
);

/**
 * The failure strip's own exit — it fades on the toast's clock, so the two
 * verdicts of one action leave together (operator ruling 2026-08-13). A
 * variant rather than a Transition so the strip's timer owns the beat.
 */
export const failureStrip = cva("transition-opacity duration-500", {
  variants: {
    isLeaving: {
      true: "opacity-0",
      false: ""
    }
  },
  defaultVariants: { isLeaving: false }
});

/**
 * What a declared column RESERVES, called per header rather than resolved
 * through `useStyles`: the width belongs to the column, and `useStyles` resolves
 * its variants once against the component's single `meta` object.
 *
 * A fluid column takes an equal share of what the content-sized ones leave, so
 * a sort that swaps the page's rows cannot resize it: the widths are reserved by
 * the frame, never measured off the data. A content column takes its own width
 * and no more — `w-px` is the shrink-to-fit idiom the actions anchor already
 * uses, which in a table resolves to the widest thing in the column rather than
 * to a pixel (`R7-2`). A declared share ({@link TableColumnWidthTypes}) reserves
 * a fixed fraction instead, so two fluid text columns need not split the row
 * evenly. A label stays on ONE line either way: a header that wraps re-measures
 * the row it heads, which is the very thing the reserved share prevents (`R6-5`).
 * One `size` variant rather than two, so the fraction and the fluid default can
 * never both land on the column and leave tailwind to arbitrate `w-full`.
 */
export const headerCell = cva("whitespace-nowrap", {
  variants: {
    size: {
      content: "w-px",
      fluid: "w-full",
      [TableColumnWidthTypes.QUARTER]: "w-1/4",
      [TableColumnWidthTypes.THIRD]: "w-1/3",
      [TableColumnWidthTypes.HALF]: "w-1/2"
    }
  },
  defaultVariants: { size: "fluid" }
});

/**
 * The pagination region while a scenario drives the collection (`R6-23`). The ui
 * `Pagination` carries no disabled channel, so the refusal is the region's own
 * `inert` and this muting is what makes it READ as refused rather than dead;
 * opacity reserves no space, so arming a track moves nothing.
 */
export const paginationRegion = cva("", {
  variants: {
    isLocked: {
      true: "cursor-not-allowed opacity-60",
      false: ""
    }
  },
  defaultVariants: { isLocked: false }
});

export default {
  listSurface: {
    root: cva("space-y-4"),

    // THREE rows, in the order the eye reads them: what may narrow the
    // collection, what is narrowing it, and what the collection amounts to
    // (G3/G5/H1). They sit closer to each other than to the records they steer,
    // so they read as one cluster rather than three lines of chrome. The facets'
    // own wrapping is the filter declaration's (`filterRow.config.ts`), never a
    // width this surface imposes on the bar (D13/H3).
    controls: cva("space-y-2"),

    // The whole table's rhythm, in one place so the header, the data rows, the
    // skeleton and the empty frame are measured the same way.
    // · `py-2` is the compact row — the ui TableCell's own `p-4` is a page
    //   card's rhythm and doubles every row's height.
    // · a refused record is a row group of its own, and the ui body drops the
    //   rule under its own last row — which is the table's closing edge, not
    //   every group's. The rule is given back to every group but the last, so
    //   splitting the body changes what marks a record, never what separates
    //   two.
    // · `p-1` is the refused group's ring standoff, reserved CONSTANTLY and on
    //   EVERY side so neither the state nor the row's position changes the
    //   table's geometry: the ui `Table` draws its own `overflow-auto` scroller,
    //   which clips a row group's offset outline unless the group's box sits
    //   inside the scroller by the offset plus its width — and the group that
    //   fails is as often the LAST one as any other, whose ring would otherwise
    //   lose its closing edge. Table padding is honoured only in the SEPARATED
    //   border model, and the rules are all `tr`-level, so separating them
    //   changes where the ring can draw and nothing else.
    table: cva(
      "border-separate border-spacing-0 p-1 [&_tbody:not(:last-child)_tr:last-child]:border-b [&_td]:py-2"
    ),

    // A sortable header draws its label inside a `sm` Button; the button's own
    // inset is given back so the header's text lands on the very same edge as
    // the cell beneath it and as the headers that carry no control.
    sortControl: cva("text-muted -ml-2.5"),

    cellContent: cva("flex flex-wrap items-center gap-2"),

    // Shrink-to-fit, so the last column ends at the row's right edge instead of
    // taking an equal share of it and leaving the controls stranded mid-table.
    actionsCell: cva("w-px whitespace-nowrap"),

    skeletonCell: cva("h-4 w-full"),

    skeletonActions: cva("ml-auto h-8 w-20"),

    // Small records read three across on a desktop and collapse from there,
    // never one card per row.
    cardGrid: cva("grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3"),

    cardHeader: cva("flex w-full items-start justify-between gap-2"),

    // The card's own marker column: the star leads the title instead of sitting
    // inside it, the same law the table's first column draws.
    cardLead: cva("flex min-w-0 items-center gap-2"),

    // `min-w-0` and the break are what stop a long unbroken value — an email
    // address has no spaces to wrap at — from running out of the lead and under
    // the row's own controls.
    cardTitle: cva(
      "text-md m-0 flex min-w-0 flex-wrap items-center gap-x-2 font-medium break-all"
    ),

    // A declared slot whose row has nothing to put in it takes no space: its
    // line height would otherwise read as a gap the card never asked for.
    cardSubtitle: cva("text-muted m-0 text-sm empty:hidden"),

    cardBody: cva("flex flex-wrap items-center gap-2 empty:hidden"),

    skeletonCard: cva("h-5 w-full"),

    // The strip sits under the row it belongs to, inside the group's own ring:
    // no fill of its own, and no rule between the two, so the pair reads as one
    // record in an error state (F4/H8).
    failureCell: cva("py-0 pb-2"),

    // The reason is not a record, so it takes no record's hover treatment: the
    // ui row's own `hover:bg-accent-neutral/20` washed a translucent band across
    // the message the moment the pointer that fired the action rested on it, and
    // a fill is the treatment the ruling killed (`H8`/`S15`).
    failureRow: cva("hover:bg-transparent"),

    rowList: cva("space-y-2"),

    rowListFields: cva("flex flex-wrap items-center gap-3 text-sm"),

    // A full-width line of its own, under the row it belongs to.
    rowListFailure: cva("w-full"),

    rowListField: cva("text-muted flex items-center gap-2")
  }
};
