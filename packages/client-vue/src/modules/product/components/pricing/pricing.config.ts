import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const currentVariants = cva("");
export const exVariants = cva("text-emphasis-medium text-sm");

export default {
  pricing: {
    ex: exVariants,
    current: currentVariants
  }
};
