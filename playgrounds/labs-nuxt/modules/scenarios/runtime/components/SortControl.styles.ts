import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SortControl.styles
 * @description CVA configuration for SortControl.
 *
 * Handed to `Select`'s own `uiConfig` channel — the `SceneRail`/`Stepper`
 * precedent: the field picker IS the ui component, brought to the row's scale,
 * never a second picker drawn beside it. The group's `size` carries the text
 * scale but no density of its own (the trigger's padding AND its chevron gutter
 * are fixed at page scale in the primitive), so the row scale is stated here in
 * `Button`'s own `sm` tokens — which is where the direction control inside the
 * group and the view toggle beside it already stand.
 */

export default {
  sortControl: {
    // The trigger's own inset, and the gutter it holds before the chevron: both
    // are `px-4`/`pl-4` in the primitive, which is a page control's scale and is
    // what made the cluster set the display row's height and width (`R6-1`).
    field: cva("px-2 py-1 [&>i]:pl-2")
  }
};
