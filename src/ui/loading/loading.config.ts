// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const loadingVariants = cva();

// -----------------------------------------------------------------------------
export default {
  loading: {
    root: cva("", {
      variants: {
        isTransparent: {
          true: "bg-core-surface/60",
          false: "bg-core-surface"
        }
      }
    }),
    spinner: cva(
      "text-control-default z-50 flex w-full items-center justify-center",
      {
        variants: {
          isTransparent: {
            true: "bg-core-surface/60",
            false: "bg-core-surface"
          }
        }
      }
    )
  }
};
