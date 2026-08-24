import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/ActionPanelSurface.styles
 * @description CVA configuration for ActionPanelSurface.
 */

export const actionPanelSurface = {
  root: cva("space-y-4"),

  form: cva("max-w-xl")
};
