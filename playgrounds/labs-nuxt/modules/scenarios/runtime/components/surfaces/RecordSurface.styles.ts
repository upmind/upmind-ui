import { cva } from "class-variance-authority";
import { RecordActionColorTypes } from "../../scenario.types";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/RecordSurface.styles
 * @description CVA configuration for RecordSurface — the one panel, its header
 * bar, its sections, its footer bar and the form drawer — and for the no-id
 * lookup a record page draws instead of it.
 */

export const recordSurface = {
  // The same frame the scenario bar draws in, so the two share one width.
  root: cva(
    "border-stroke bg-surface shadow-card rounded-card flex w-full min-w-0 flex-col overflow-hidden border"
  ),

  header: cva("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"),

  heading: cva("flex min-w-0 flex-1 basis-64 items-center gap-2"),

  title: cva("min-w-0 truncate text-base font-semibold"),

  badges: cva("flex shrink-0 items-center gap-1.5"),

  actions: cva("ml-auto flex flex-wrap items-center justify-end gap-2"),

  lead: cva("flex flex-col gap-0.5 px-4 pb-3 text-sm"),

  leadTitle: cva("font-medium"),

  leadText: cva("text-muted"),

  alert: cva("mx-4 mb-3"),

  body: cva("border-stroke flex flex-col gap-6 border-t px-4 py-4"),

  section: cva("flex min-w-0 flex-col gap-2"),

  footer: cva(
    "border-stroke flex flex-wrap items-center justify-end gap-2 border-t px-4 py-2.5"
  ),

  writes: cva("flex flex-wrap items-center justify-end gap-2"),

  utilities: cva("flex flex-wrap items-center justify-end gap-2"),

  // @upmind/ui ships no primary-tinted soft Button variant (`subtle` is
  // neutral), so every footer control takes the primary-muted tokens over ghost.
  utility: cva("", {
    variants: {
      color: {
        [RecordActionColorTypes.PRIMARY]:
          "bg-primary-muted text-primary-muted-contrast hover:bg-primary-muted-delta active:bg-primary-muted-active",
        [RecordActionColorTypes.DANGER]:
          "bg-danger-muted text-danger-muted-contrast hover:bg-danger-muted-delta active:bg-danger-muted-active"
      }
    },
    defaultVariants: { color: RecordActionColorTypes.PRIMARY }
  }),

  skeletonTitle: cva("h-6 w-48"),

  skeletonBadge: cva("h-5 w-16 rounded-full"),

  skeletonAction: cva("h-8 w-28"),

  skeletonHeading: cva("h-3 w-20"),

  skeletonGrid: cva(
    "grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
  ),

  skeletonField: cva("flex flex-col gap-1"),

  skeletonLabel: cva("h-4 w-24"),

  skeletonValue: cva("h-5 w-40"),

  skeletonRow: cva("flex items-center justify-between gap-3 py-1"),

  skeletonUtility: cva("h-7 w-20"),

  form: cva("flex flex-col gap-4"),

  formActions: cva("flex justify-end gap-3")
};

export const recordLookup = {
  root: cva("flex flex-col gap-4"),

  input: cva("flex items-end gap-3")
};
