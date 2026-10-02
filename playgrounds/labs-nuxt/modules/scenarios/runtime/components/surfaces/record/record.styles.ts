import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/record.styles
 * @description CVA configuration for the record-section renderers.
 */

export const recordSection = {
  // Fractional field widths share the row, so the gutter is padding, not gap;
  // below lg a field takes half the row, below sm the whole of it.
  grid: cva(
    "-mx-2 flex flex-wrap gap-x-0 max-sm:[&>*]:!w-full sm:max-lg:[&>*]:!w-1/2"
  ),

  field: cva("min-w-0 px-2"),

  empty: cva("text-muted"),

  items: cva("flex flex-col gap-6"),

  rowCells: cva(
    "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-0.5 text-sm"
  ),

  summary: cva("text-muted flex flex-wrap justify-end gap-x-4 pt-2 text-sm"),

  none: cva("text-muted text-sm"),

  skeletonRow: cva("flex items-center justify-between gap-4"),

  skeletonLabel: cva("h-5 w-48"),

  skeletonAction: cva("h-5 w-20")
};

export const recordThread = {
  root: cva("flex flex-col gap-4"),

  heading: cva("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"),

  author: cva("font-medium"),

  date: cva("text-muted"),

  links: cva("ms-auto flex flex-wrap items-center gap-3"),

  body: cva("pt-1 text-sm"),

  files: cva("flex flex-wrap gap-2 pt-2"),

  log: cva("text-muted text-sm"),

  composer: cva("flex flex-col gap-3 border-t pt-4"),

  attachments: cva("flex flex-col gap-2"),

  attachActions: cva("flex flex-wrap items-center gap-2"),

  uploads: cva("flex flex-col gap-2"),

  send: cva("flex justify-end")
};
