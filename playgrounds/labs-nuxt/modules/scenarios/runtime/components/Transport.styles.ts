import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/Transport.styles
 * @description CVA configuration for Transport.
 */

export const transport = {
  // One tight cluster: the controls read as a single instrument rather than
  // three loose buttons, and the cluster keeps its width while a scene runs
  // so nothing under it shifts mid-track.
  root: cva("flex shrink-0 items-center gap-1")
};
