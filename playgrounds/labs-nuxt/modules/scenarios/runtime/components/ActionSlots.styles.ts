import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ActionSlots.styles
 * @description CVA configuration for ActionSlots.
 */

export default {
  actionSlots: {
    // ONE horizontal cluster, whatever it is drawn inside. `inline-flex` +
    // `align-middle` because the ui ContextMenu's trigger is a `span`, and a
    // block box inside it would take the whole line; `flex-nowrap` because a
    // shrink-to-fit table cell resolves a wrapping cluster at its narrowest —
    // one control per line, and a row as tall as it has actions.
    root: cva(
      "inline-flex flex-nowrap items-center justify-end gap-1 align-middle"
    )
  }
};
