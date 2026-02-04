// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const checkboxVariants = cva(``, {
  variants: {
    size: {
      sm: "h-3 w-3",
      md: "h-4 w-4"
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
