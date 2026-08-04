import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module factory/ContextPanel.styles
 * @description CVA configuration for ContextPanel.
 */

export default {
  contextPanel: {
    root: cva(""),

    title: cva("text-display mb-2 text-sm font-bold"),

    list: cva("space-y-1"),

    collapsible: cva(""),

    trigger: cva(
      "text-muted hover:text-display cursor-pointer text-xs font-semibold tracking-wider uppercase transition-colors"
    ),

    pre: cva(
      "bg-canvas mt-2 max-h-48 overflow-auto rounded p-2 text-xs whitespace-pre-wrap"
    )
  }
};
