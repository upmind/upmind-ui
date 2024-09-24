import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const containerVariant = cva("mx-auto w-full", {
  variants: {
    maxWidth: {
      xs: "max-w-xs",
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
    },
    defaultVariants: {
      maxWidth: "md",
    },
  },
});

export default {
  container: containerVariant,
};
