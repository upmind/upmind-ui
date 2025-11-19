// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const loadingVariants = cva();

// -----------------------------------------------------------------------------
const variants = {
  isActive: {
    true: "",
    false: ""
  },
  isTransparent: {
    true: "",
    false: ""
  }
};
export default {
  loading: {
    root: cva("", {
      variants
    }),
    spinner: cva(
      "text-control-default bg-canvas/50 z-50 flex w-full items-center justify-center",
      {
        variants
      }
    )
  }
};
