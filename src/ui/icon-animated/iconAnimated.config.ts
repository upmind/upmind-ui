import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const iconVariants = cva(
  "inline-flex aspect-square flex-shrink-0 align-middle [&>svg]:size-full",
  {
    variants: {
      size: {
        auto: "h-full w-auto",
        "3xs": "size-3",
        "2xs": "size-4",
        xs: "size-6",
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
        xl: "size-16",
        "2xl": "size-20",
        "3xl": "size-24",
        "4xl": "size-32"
      },
      defaultVariants: {
        size: "md"
      }
    }
  }
);

export default {
  iconAnimated: iconVariants
};
