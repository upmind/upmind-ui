import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ScenarioMenu.styles
 * @description CVA configuration for ScenarioMenu.
 */

export default {
  scenarioMenu: {
    root: cva("flex shrink-0 flex-nowrap items-center gap-1"),

    // Wide enough for a scenario's whole sentence, and capped in height with its
    // own scroll: eleven scenarios plus the forced states are taller than the
    // space under the bar — uncapped, the panel runs off the bottom of the
    // viewport and the page edge clips its last entries (`R6-17`, kept by
    // `R7-11`).
    panel: cva("max-h-96 w-96 overflow-y-auto")
  }
};
