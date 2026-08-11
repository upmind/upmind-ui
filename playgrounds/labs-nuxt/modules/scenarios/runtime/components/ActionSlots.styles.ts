import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ActionSlots.styles
 * @description CVA configuration for ActionSlots.
 */

export default {
  actionSlots: {
    // `w-full` because the ui ContextMenu's trigger is a `span`: without it the
    // controls sit in an inline box and never reach their container's edge.
    root: cva("flex w-full flex-wrap items-center justify-end gap-2")
  }
};
