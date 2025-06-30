import { cva } from "class-variance-authority";

export const breadcrumbVariants = cva("", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export default {
  breadcrumb: breadcrumbVariants,
};
