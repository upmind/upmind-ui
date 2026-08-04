import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module factory/ActionSlots.styles
 * @description CVA configuration for ActionSlots.
 */

export default {
  actionSlots: {
    root: cva("flex flex-wrap items-center gap-2"),

    alwaysVisible: cva("flex flex-wrap items-center gap-2"),

    overflowTrigger: cva("")
  }
};
