import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/PageHeader.styles
 * @description CVA configuration for PageHeader.
 */

export default {
  pageHeader: {
    root: cva("flex flex-wrap items-center gap-3"),

    // The title takes the leftover width so the actions land at the far end of
    // the row while staying its SIBLINGS — never nested inside a cluster of
    // their own, which is what put them in the display row (G4).
    title: cva("text-display mr-auto text-3xl font-bold")
  }
};
