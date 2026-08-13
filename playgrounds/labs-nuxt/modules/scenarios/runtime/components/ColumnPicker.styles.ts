import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ColumnPicker.styles
 * @description CVA configuration for ColumnPicker.
 */

export default {
  columnPicker: {
    // Wide enough for a column header to read whole beside its checkbox, and
    // capped in height, so a module declaring many columns scrolls its own menu
    // rather than running off the bottom of the viewport (`R6-17`). Nothing
    // else is stated here: the surface, the elevation and the radius are the ui
    // menu panel's own, which is what makes this menu and every other one in
    // the product the same object (`R7-3`).
    content: cva("max-h-96 w-56 overflow-y-auto")
  }
};
