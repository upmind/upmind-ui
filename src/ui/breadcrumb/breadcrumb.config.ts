import { cva } from "class-variance-authority";

export const rootVariants = cva("gap-1 font-normal sm:gap-1", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg"
    }
  },
  defaultVariants: {
    size: "md"
  }
});

export const itemVariants = cva("gap-0 font-normal");

export default {
  breadcrumb: {
    root: rootVariants,
    item: itemVariants
  }
};
