import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/PageHeader.styles
 * @description CVA configuration for PageHeader.
 */

export const pageHeader = {
  root: cva("flex flex-wrap items-center gap-3"),

  title: cva("text-display mr-auto text-3xl font-bold")
};
