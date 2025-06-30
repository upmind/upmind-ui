// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// --- for out Typescript type
export const spinnerVariants = cva(
  "inline-block aspect-square flex-shrink-0 animate-spin rounded-[100%] border-[0.2em] border-current !border-t-transparent text-current",
  {
    variants: {
      size: {
        auto: "h-full",
        square: "size-4",
        icon: "size-10",
        badge: "size-3",
        xs: "size-4",
        sm: "size-6",
        md: "size-10",
        lg: "size-12 border-[0.2em]",
        xl: "size-14 border-[0.4em]",
        "2xl": "size-16 border-[0.6em]"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

// -----------------------------------------------------------------------------
// --- for our useStyles helper
export default {
  spinner: spinnerVariants
};
