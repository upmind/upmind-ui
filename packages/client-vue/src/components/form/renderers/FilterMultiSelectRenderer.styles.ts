import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterMultiSelectRenderer.styles
 * @description CVA configuration for FilterMultiSelectRenderer.
 */

export const filterMultiSelect = {
  // Wide enough for a status to read whole beside its checkbox, and capped in
  // height so a long vocabulary scrolls its own menu rather than running off
  // the bottom of the viewport. Nothing else is stated here: the surface, the
  // elevation and the radius are the ui menu panel's own, which is what makes
  // this menu and the column picker the same object.
  content: cva("max-h-96 w-56 overflow-y-auto")
};
