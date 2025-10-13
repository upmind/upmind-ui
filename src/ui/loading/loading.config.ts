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
      variants,
      compoundVariants: [
        {
          isActive: true,
          isTransparent: true,
          class: "bg-core-surface/60"
        },
        {
          isActive: true,
          isTransparent: false,
          class: "bg-core-surface"
        }
      ]
    }),
    spinner: cva(
      "text-control-default z-50 flex w-full items-center justify-center",
      {
        variants,
        compoundVariants: [
          {
            isActive: true,
            isTransparent: true,
            class: "bg-core-surface/60"
          },
          {
            isActive: true,
            isTransparent: false,
            class: "bg-core-surface"
          }
        ]
      }
    )
  }
};
