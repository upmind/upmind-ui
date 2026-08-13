import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ModuleStateNotice.styles
 * @description CVA configuration for ModuleStateNotice.
 */

export default {
  moduleStateNotice: {
    root: cva(""),

    // A sentence, drawn as one: the envelope it arrived in is the Debug sheet's.
    detail: cva("text-accent-danger m-0 mt-1 text-sm")
  }
};
