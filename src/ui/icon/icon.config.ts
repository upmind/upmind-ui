import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const iconVariants = cva("[&>svg]:size-full", {
  variants: {
    size: {
      auto: "",
      nano: "size-4",
      "2xs": "size-5",
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
});

export default {
  icon: iconVariants
};
