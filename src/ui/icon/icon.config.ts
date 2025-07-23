import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const iconVariants = cva(
  "inline-flex aspect-square flex-shrink-0 align-middle [&>svg]:size-full",
  {
    variants: {
      size: {
        auto: "size-[1lh]",
        nano: "size-4",
        "3xs": "size-6",
        "2xs": "size-6",
        xs: "size-6",
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
        xl: "size-14",
        "2xl": "size-16",
        "3xl": "size-20"
      },
      defaultVariants: {
        size: "auto"
      }
    }
  }
);

export default {
  icon: iconVariants
};
