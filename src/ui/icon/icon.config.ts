import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const iconVariants = cva(
  "inline-block transition-transform duration-200 aria-checked:rotate-180",
  {
    variants: {
      size: {
        auto: "[&>svg]:size-full",
        nano: "[&>svg]:size-4",
        "3xs": "[&>svg]:size-2",
        "2xs": "[&>svg]:size-5",
        xs: "[&>svg]:size-6",
        sm: "[&>svg]:size-8",
        md: "[&>svg]:size-10",
        lg: "[&>svg]:size-12",
        xl: "[&>svg]:size-14",
        "2xl": "[&>svg]:size-16",
        "3xl": "[&>svg]:size-20"
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
