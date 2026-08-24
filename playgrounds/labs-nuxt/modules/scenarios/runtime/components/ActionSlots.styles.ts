import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ActionSlots.styles
 * @description CVA configuration for ActionSlots.
 */

export const actionSlots = {
  // ONE horizontal cluster, whatever it is drawn inside. `inline-flex` +
  // `align-middle` because the ui ContextMenu's trigger is a `span`, and a
  // block box inside it would take the whole line; `flex-nowrap` because a
  // shrink-to-fit table cell resolves a wrapping cluster at its narrowest —
  // one control per line, and a row as tall as it has actions.
  root: cva("flex-nowrap items-center justify-end gap-1 align-middle", {
    variants: {
      // A footer group takes the width it is given; a row cluster stays
      // shrink-to-fit for the reasons above.
      // Each control is wrapped in its own tooltip trigger, so the share
      // is given to the wrappers; the Button's `block` fills each one.
      stretch: {
        false: "inline-flex",
        true: "flex w-full gap-2 [&>*]:flex-1"
      }
    },
    defaultVariants: { stretch: false }
  })
};
