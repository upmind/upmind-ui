import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module factory/ModuleStateNotice.styles
 * @description CVA configuration for ModuleStateNotice.
 */

export default {
  moduleStateNotice: {
    root: cva(""),

    detail: cva(
      "bg-canvas mt-2 max-h-48 overflow-auto rounded p-2 font-mono text-xs whitespace-pre-wrap"
    )
  }
};
