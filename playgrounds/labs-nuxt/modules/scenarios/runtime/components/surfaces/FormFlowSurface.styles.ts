import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/FormFlowSurface.styles
 * @description CVA configuration for FormFlowSurface.
 */

export default {
  formFlowSurface: {
    // The placeholder wears the ui Form's OWN geometry (`ui/form/form.config`:
    // root `flex-col gap-6`, wrapper `space-y-4`, stacked field `gap-1`, actions
    // `flex-wrap gap-2`), so the real form lands exactly where it stood.
    skeleton: cva("flex w-full flex-col gap-6"),

    skeletonFields: cva("w-full space-y-4"),

    skeletonField: cva("flex w-full flex-col gap-1"),

    skeletonLabel: cva("h-5 w-24"),

    skeletonControl: cva("h-10 w-full"),

    skeletonActions: cva("flex w-full flex-wrap gap-2"),

    skeletonAction: cva("h-9 w-28"),

    // The ui Form's own `gap-6` sits between the elements it renders; the
    // verdict rides above the form, at the same rhythm.
    failure: cva("mb-6")
  }
};
