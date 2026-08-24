import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ScenarioMenu.styles
 * @description CVA configuration for ScenarioMenu.
 */

export const scenarioMenu = {
  root: cva("flex shrink-0 flex-nowrap items-center gap-1"),

  // Wide enough for a scenario's whole sentence, and capped in height with its
  // own scroll: eleven scenarios plus the forced states are taller than the
  // space under the bar — uncapped, the panel runs off the bottom of the
  // viewport and the page edge clips its last entries (`R6-17`, kept by
  // `R7-11`).
  // The forced presets are a fixed pair and the scenarios a list that grows
  // with the module's feature, so the presets lead: a panel capped for the
  // viewport otherwise hides them below a scroll nobody knows is there.
  panel: cva("max-h-96 w-96 overflow-y-auto")
};
