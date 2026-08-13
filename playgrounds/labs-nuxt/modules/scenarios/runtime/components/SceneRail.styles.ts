import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SceneRail.styles
 * @description CVA configuration for SceneRail.
 *
 * Everything below is handed to `Stepper`'s own `uiConfig` channel, and there is
 * almost nothing of it: the rail has its own full-width row now (`R7-8`), so the
 * component's own scale and typography stand as the package drew them and only
 * the PLAYING colour is restated. The caps and clamps this file used to carry
 * existed to survive being crammed inline beside the transport, which is exactly
 * the illegibility the ruling removed.
 */

export default {
  sceneRail: {
    // Its own row, so it takes the page's width and nothing scrolls sideways:
    // a stop's label wraps inside its own column instead (`AC2.4`).
    root: cva("w-full min-w-0"),

    // A flex item defaults to `min-width:auto` and refuses to go below its
    // content, so one long Gherkin sentence would set the row's width and the
    // PAGE would gain the horizontal scrollbar the rail is supposed to absorb.
    item: cva("min-w-0"),

    // The played part of the track reads primary, the rest neutral — the
    // playing treatment is the primary family throughout (H2).
    indicator: cva(
      "group-data-[state=active]:bg-accent-primary group-data-[state=active]:text-accent-primary-contrast group-data-[state=completed]:bg-accent-primary group-data-[state=completed]:text-accent-primary-contrast"
    ),

    separator: cva(
      "group-data-[state=completed]:bg-accent-primary group-data-[state=active]:first:bg-accent-primary"
    )
  }
};
