import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DisplayRow.styles
 * @description CVA configuration for DisplayRow.
 *
 * One line, two clusters: what the collection amounts to and what narrowed it
 * on the left, what changes how it is drawn on the right. It wraps rather than
 * scrolls, so the count, the chips and the controls stay whole on a narrow
 * canvas.
 */

export const displayRow = {
  root: cva("flex flex-wrap items-center gap-3"),

  lead: cva("flex min-w-0 flex-wrap items-center gap-3"),

  results: cva("text-muted m-0 flex items-center gap-2 text-sm"),

  resultsLabel: cva("text-display font-medium"),

  // The ui Separator is `h-full` when vertical, which in a wrapping flex row
  // resolves to the tallest control's height; the count reads as a line, so
  // the rule is held to the text's own.
  divider: cva("h-4"),

  count: cva(""),

  controls: cva("ml-auto flex items-center gap-2")
};
