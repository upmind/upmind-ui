import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/RefinementsRow.styles
 * @description CVA configuration for RefinementsRow.
 *
 * One line under the facets that WRAPS rather than scrolls: every active
 * narrowing stays visible and readable at any canvas width, which is the whole
 * point of drawing it as chips.
 */

export default {
  refinementsRow: {
    // The locked row is MUTED, never resized (`R6-23`): a chip's × is an `Icon`
    // with a click handler and the ui Badge exposes no disabled channel, so the
    // whole row is made `inert` — withdrawing the × instead would narrow every
    // chip the moment a track armed.
    root: cva("flex flex-wrap items-center gap-2", {
      variants: {
        isLocked: {
          true: "cursor-not-allowed opacity-60",
          false: ""
        }
      },
      defaultVariants: { isLocked: false }
    })
  }
};
