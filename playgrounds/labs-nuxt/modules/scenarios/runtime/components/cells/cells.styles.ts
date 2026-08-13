import { cva } from "class-variance-authority";
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
      true: "text-accent-primary",
      false: "text-muted"
    }
  },
  defaultVariants: { isFlagged: false }
});
