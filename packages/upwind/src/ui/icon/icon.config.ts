import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const iconVariants = cva(
  "inline-flex flex-shrink-0 align-middle [&>svg]:h-full [&>svg]:w-full",
  {
    variants: {
      size: {
        full: "h-full w-full",
        "3xs": "size-3",
        "2xs": "size-4",
        xs: "size-6",
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
        xl: "size-14",
        "2xl": "size-16",
      },
      defaultVariants: {
        size: "none",
      },
    },
  }
);

export default {
  icon: iconVariants,
};
