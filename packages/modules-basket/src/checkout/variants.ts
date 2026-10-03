import { cva } from "class-variance-authority";

// The setup step's inline copy and CTA, plus the load-state bars standing in
// for the setup form.
export const setupProductNameVariants = cva("text-muted text-sm");
export const setupContinueVariants = cva("mt-6 w-full");

export const setupSkeletonRootVariants = cva("flex w-full flex-col gap-6");
export const setupSkeletonFieldVariants = cva("flex flex-col gap-2");
// varied label widths read as real content, not a repeated pattern
export const setupSkeletonLabelVariants = cva("h-4 w-24");
export const setupSkeletonLabelWideVariants = cva("h-4 w-28");
export const setupSkeletonInputVariants = cva("h-10 w-full");
export const setupSkeletonButtonVariants = cva("h-12 w-full");

// trailing placeholder under the saved-billing fields
export const billingSkeletonDetailVariants = cva("mt-2 h-4 w-36");
