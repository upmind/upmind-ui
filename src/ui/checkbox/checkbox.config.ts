// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const checkboxVariants = cva(``, {
  variants: {
    size: {
      sm: "h-2 w-2",
      md: "h-3 w-3"
    }
  },
  defaultVariants: {
    size: "md"
  }
});

// -----------------------------------------------------------------------------
export default {
  checkbox: checkboxVariants
};
