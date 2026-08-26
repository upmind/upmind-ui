import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DisplayRow.styles
 * @description CVA configuration for DisplayRow — results label, sort, view toggle.
 */

export const displayRow = {
  root: cva("mb-2 flex flex-wrap items-center gap-2"),

  divider: cva("mx-1 h-3"),

  controls: cva("ml-auto flex items-center gap-2")
};
