// ---  external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const radioGroupItemVariants = cva("", {
  variants: {
    required: {
      true: "rounded-full",
      false: "rounded-sm",
    },
  },
  defaultVariants: {
    required: false,
  },
});

// -----------------------------------------------------------------------------
export default {
  radioGroupItem: radioGroupItemVariants,
};
