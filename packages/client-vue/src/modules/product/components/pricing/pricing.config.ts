import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const currentVariants = cva("text-md-tight", {
  variants: {
    useMonthlyFromPrice: {
      true: "flex items-baseline gap-1",
      false: ""
    }
  }
});
export const exVariants = cva("text-muted text-sm-loose font-normal");
export const currentSkeletonVariants = cva("my-px h-6 w-20");
export const exSkeletonVariants = cva("my-px h-4 w-14");

export default {
  pricing: {
    ex: exVariants,
    current: currentVariants,
    term: cva("text-sm font-normal"),
    currentSkeleton: currentSkeletonVariants,
    exSkeleton: exSkeletonVariants
  }
};
