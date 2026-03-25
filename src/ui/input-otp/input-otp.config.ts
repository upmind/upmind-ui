// --- external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const containerVariants = cva(
  "flex items-center gap-2 has-disabled:opacity-50 transition-opacity duration-200",
  {
    variants: {
      width: {
        auto: "w-auto",
        full: "w-full"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  input: {
    container: containerVariants
  }
};
