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

const compoundVariants = [
  {
    isActive: true,
    isTransparent: true,
    class: "opacity-50"
  },
  {
    isActive: true,
    isTransparent: false,
    class: "bg-canvas"
  }
];

export default {
  loading: {
    root: cva(""),
    content: cva("", {
      variants,
      compoundVariants
    }),
    spinner: cva(
      "text-control-default z-50 flex w-full items-center justify-center"
    )
  }
};
