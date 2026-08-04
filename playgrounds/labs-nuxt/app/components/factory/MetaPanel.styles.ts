import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module factory/MetaPanel.styles
 * @description CVA configuration for MetaPanel.
 */

export default {
  metaPanel: {
    root: cva(""),

    title: cva("text-display mb-2 text-sm font-bold"),

    list: cva("flex flex-wrap gap-2")
  }
};
