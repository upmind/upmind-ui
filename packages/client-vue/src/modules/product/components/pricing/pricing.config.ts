import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const currentVariants = cva("leading-none");
export const exVariants = cva("text-emphasis-disabled text-xs leading-none");

export default {
  pricing: {
    ex: exVariants,
    current: currentVariants
  }
};
