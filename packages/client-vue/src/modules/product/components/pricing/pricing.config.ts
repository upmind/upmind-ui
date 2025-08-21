import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const currentVariants = cva("");
export const exVariants = cva("text-emphasis-disabled text-sm");

export default {
  pricing: {
    ex: exVariants,
    current: currentVariants
  }
};
