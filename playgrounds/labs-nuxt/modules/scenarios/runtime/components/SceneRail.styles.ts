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

export const sceneRail = {
  // Its own row, so it takes the page's width and nothing scrolls sideways:
  // a stop's label wraps inside its own column instead (`AC2.4`).
  root: cva("w-full min-w-0"),

  // A flex item defaults to `min-width:auto` and refuses to go below its
  // content, so one long Gherkin sentence would set the row's width and the
  // PAGE would gain the horizontal scrollbar the rail is supposed to absorb.
  item: cva("min-w-0 flex-1"),

  // A stop LOOKS interactive because it IS one — a seek target, not a marker
  // (`R6-22`), and this rail is the same stops the Scenario sheet's list draws
  // (`R6-24`), where a row already carries the pointer. Stated here because
  // tailwind v4's preflight dropped the button cursor and the package's own
  // stepper trigger never restated it, so the rail's steps are the one
  // control in the bar that reads as text.
  trigger: cva("cursor-pointer"),

  // The played part of the track reads primary, the rest neutral — the
  // playing treatment is the primary family throughout (H2).
  indicator: cva(
    "group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-contrast group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-contrast"
  ),

  separator: cva(
    "group-data-[state=completed]:bg-primary group-data-[state=active]:first:bg-primary"
  )
};
