import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const benefitRootVariants = cva(
  "flex items-start gap-2 text-base leading-tight"
);
export const benefitIconVariants = cva("text-secondary size-5 shrink-0");
export const benefitLabelVariants = cva("m-0");

export const carouselNavigationVariants = cva("flex justify-end space-x-2");
export const carouselItemVariants = cva("pl-12 md:basis-1/2 xl:basis-1/3");

export const footerRootVariants = cva(
  "flex w-full flex-col-reverse items-center gap-4 lg:flex-row lg:justify-between"
);
export const footerLabelVariants = cva(
  "m-0 text-center text-base font-medium lg:text-left"
);
export const footerButtonVariants = cva("w-full lg:w-auto");
