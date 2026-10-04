import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const formSectionsVariants = cva("min-h-32");

// Enclosing card around the readonly details; empty when the Section is
// already a card and the details render flat.
export const cardRootVariants = cva("", {
  variants: {
    card: {
      true: "",
      false: "space-y-4 p-6 lg:p-8"
    }
  },
  defaultVariants: { card: false }
});

export const summaryRootVariants = cva("space-y-1 text-sm");
export const summaryRowVariants = cva("flex items-start gap-2 font-medium");
export const summaryLabelVariants = cva(
  "data-[danger=true]:text-danger data-[danger=false]:text-muted w-24 font-normal"
);
export const summaryValueVariants = cva("flex items-center gap-2");
export const summaryAvatarVariants = cva("size-4");

// Summary load-state bars — ported from the retired billing.config. Widths
// stand in for the saved billing details before they arrive; varied widths read
// as real content rather than a repeated pattern.
export const summarySkeletonActionVariants = cva("h-4 w-14");
export const summarySkeletonCompanyLabelVariants = cva("h-4 w-16");
export const summarySkeletonCompanyValueVariants = cva("h-4 w-28");
export const summarySkeletonPhoneLabelVariants = cva("h-4 w-12");
export const summarySkeletonPhoneValueVariants = cva("h-4 w-32");
export const summarySkeletonAddressLabelVariants = cva("h-4 w-16");
export const summarySkeletonAddressVariants = cva("flex flex-col gap-1");
export const summarySkeletonAddressLineVariants = cva("h-4 w-36");
export const summarySkeletonAddressCityVariants = cva("h-4 w-24");
