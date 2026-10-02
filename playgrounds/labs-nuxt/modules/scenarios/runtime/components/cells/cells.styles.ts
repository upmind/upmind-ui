import { cva } from "class-variance-authority";
import { TableCellListLayoutTypes } from "../../scenario.types";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/cells.styles
 * @description CVA configuration for the declared-cell renderers.
 */

/**
 * The glyph a boolean cell draws on EVERY row — accented where the flag is set,
 * quiet where it is not, so the flagged row reads as one choice among many
 * rather than the only row carrying a mark (`R6-34`). `block` because the ui
 * Icon is an inline `<i>`, which would otherwise sit on the cell's text
 * baseline instead of its middle.
 */
export const cellIcon = cva("block", {
  variants: {
    isFlagged: {
      true: "text-primary",
      false: "text-muted"
    }
  },
  defaultVariants: { isFlagged: false }
});

/**
 * A block of rendered markup — an email body drawn through `Sanitized`. It is a
 * block, not the inline run a text cell is, so it wraps its own long words and
 * keeps a comfortable reading measure.
 */
export const cellHtml = cva("text-sm leading-relaxed break-words");

export const cellList = {
  root: cva("flex flex-col", {
    variants: {
      layout: {
        [TableCellListLayoutTypes.CARDS]: "gap-3",
        [TableCellListLayoutTypes.ROWS]: "gap-1"
      }
    },
    defaultVariants: { layout: TableCellListLayoutTypes.CARDS }
  }),
  item: cva("", {
    variants: {
      layout: {
        [TableCellListLayoutTypes.CARDS]:
          "border-stroke flex flex-col gap-1 rounded-md border p-3",
        [TableCellListLayoutTypes.ROWS]:
          "flex items-baseline justify-between gap-4 tabular-nums"
      }
    },
    defaultVariants: { layout: TableCellListLayoutTypes.CARDS }
  }),
  // A text cell renders a bare text node, so each cell gets its own box or
  // adjacent cells run together.
  part: cva("min-w-0")
};
