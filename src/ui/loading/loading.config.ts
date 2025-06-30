// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const loadingVariants = cva();

// -----------------------------------------------------------------------------
export default {
  loading: {
    root: cva("z-50 flex items-center justify-center text-secondary", {
      variants: {
        skrim: {
          light: "bg-white/75",
          full: "bg-white"
        }
      }
    })
  }
};
