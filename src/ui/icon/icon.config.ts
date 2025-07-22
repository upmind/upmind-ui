import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const iconVariants = cva(
  "inline-flex aspect-square flex-shrink-0 align-middle [&>svg]:size-full",
  {
    variants: {
      size: {
        auto: "h-full w-auto",
        nano: "size-4",
        xs: "size-6",
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
        xl: "size-14",
        "2xl": "size-16",
        "3xl": "size-20"
      },
      defaultVariants: {
        size: "md"
      }
    }
  }
);

export default {
  icon: iconVariants
};
