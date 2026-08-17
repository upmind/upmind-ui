import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/DetailSurface.styles
 * @description CVA configuration for DetailSurface.
 */

export default {
  detailSurface: {
    root: cva("space-y-6 py-2"),

    field: cva("flex flex-col gap-1.5"),

    label: cva("text-muted text-xs font-semibold tracking-wider uppercase"),

    /** A field the record carries no value for — answered, not left blank. */
    empty: cva("text-muted")
  }
};
