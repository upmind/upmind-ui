import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ScopeBar.styles
 * @description CVA configuration for ScopeBar.
 */

export default {
  scopeBar: {
    root: cva(
      "border-surface bg-surface flex items-center gap-1 rounded-md border p-1"
    ),

    segment: cva("flex min-w-0 items-center empty:hidden"),

    // A segment decides for itself whether it renders at all (P13, or a page
    // that registers no contexts), so a rule is earned from the rendered DOM
    // rather than from any segment's own condition: it shows only where a
    // segment that drew something is followed by one that did too.
    separator: cva(
      "hidden h-5 [[data-segment]:not(:empty)~&:has(+[data-segment]:not(:empty))]:block"
    )
  }
};
