import { cva } from "class-variance-authority";
import { highlightRingClasses } from "../scenario.styles";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ForcedCanvas.styles
 * @description CVA configuration for ForcedCanvas.
 *
 * The treatment is an OUTLINE around the whole page and NOTHING else (`R6-18`):
 * no padding, no border, no background — an outline reserves no space, so
 * arming a preset cannot move a single column, and the same technique family
 * already marks a refused record (`H10`). The 1px inset ring this replaces was
 * invisible at page scale, and the padding and muted fill beside it were the
 * geometry change the ruling banned.
 *
 * Primary, never warning (`H2`): forcing is a mode the developer chose, not a
 * fault the page is reporting. So the frame takes the ui's HIGHLIGHT ring rather
 * than its invalid one, applied rather than re-spelt, exactly as a refused row
 * takes the invalid one (`ESC2`) — one outline vocabulary in the product, owned
 * by the package, with the deliberate-mode and the fault families as its two
 * members.
 */

export const forcedCanvas = {
  root: cva("flex flex-col gap-3 transition-all duration-200", {
    variants: {
      isForced: {
        true: `rounded-card ${highlightRingClasses}`,
        false: ""
      }
    },
    defaultVariants: { isForced: false }
  }),

  header: cva("flex items-center gap-2 self-end")
};
