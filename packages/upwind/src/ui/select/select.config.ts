import { cva } from "class-variance-authority";

export const triggerVariants = cva("", {
  variants: {
    width: {
      full: "w-full",
    },
  },
  defaultVariants: {
    width: "full",
  },
});

export default {
  select: {
    trigger: triggerVariants,
  },
};
