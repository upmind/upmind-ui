import { cva } from "class-variance-authority";

export const rootVariants = cva(
  "gap-1 font-normal text-base-foreground sm:gap-1",
  {
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
  }
);

export const itemVariants = cva("gap-0 font-normal text-base-foreground");

export default {
  breadcrumb: {
    root: rootVariants,
    item: itemVariants
  }
};
