import { cva } from "class-variance-authority";
import { fenceBlock } from "./sheets.styles";
// -----------------------------------------------------------------------------
/**
 * @module sheets/CodePane.styles
 * @description CVA configuration for CodePane.
 *
 * The copy control sits ON the block it copies rather than in a pane footer:
 * the outcome — the icon flipping to a tick — then lands in the path of the eye
 * that clicked it (`S14`).
 */

export default {
  codePane: {
    root: cva("relative flex flex-col gap-2"),

    // The block says what it is BEFORE the control that copies it: a pane whose
    // only affordance was a floating icon read as a dump (`R6-21`).
    toolbar: cva("flex items-center justify-between gap-2"),

    title: cva("text-display m-0 text-sm font-bold"),

    // A long call WRAPS rather than scrolling sideways: the panel is 384px and a
    // call read through a horizontal scrollbar is a call nobody reads (`R6-21`).
    snippet: cva([
      fenceBlock(),
      "prose-pre:whitespace-pre-wrap prose-code:break-words overflow-x-hidden text-xs"
    ])
  }
};
