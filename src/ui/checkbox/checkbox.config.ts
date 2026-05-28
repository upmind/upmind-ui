// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const checkboxVariants = cva(
  "disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
// -----------------------------------------------------------------------------
export default {
  checkbox: checkboxVariants
};
