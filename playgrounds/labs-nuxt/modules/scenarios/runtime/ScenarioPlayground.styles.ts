import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPlayground.styles
 * @description CVA configuration for the playground page's own frame.
 */

export const scenarioPlayground = {
  /** The page content the scrim covers — the scrim positions against it. */
  stage: cva("relative"),

  // Transparent on purpose: a replay shows the operator the page as the
  // scenario drives it, so the picture stays exactly as Live draws it and only
  // the pointer is kept off it (`R6-23`). Above the content, below the bar.
  scrim: cva("absolute inset-0 z-10 cursor-not-allowed bg-transparent")
};
