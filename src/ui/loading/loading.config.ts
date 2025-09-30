// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const loadingVariants = cva();

// -----------------------------------------------------------------------------
export default {
  loading: {
    root: cva(
      "text-secondary bg-overlay z-50 flex w-full items-center justify-center"
    )
  }
};
