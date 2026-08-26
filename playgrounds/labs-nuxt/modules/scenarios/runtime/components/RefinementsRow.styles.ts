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

export const refinementsRow = {
  root: cva("flex flex-wrap items-center gap-2", {
    variants: {
      isLocked: {
        true: "cursor-not-allowed opacity-60",
        false: ""
      }
    },
    defaultVariants: { isLocked: false }
  }),
  chip: cva("inline-flex items-center gap-1")
};
