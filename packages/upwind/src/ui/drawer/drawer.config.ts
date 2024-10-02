import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const containerVariant = cva("mx-auto w-full", {
  variants: {
    size: {
      xs: "max-w-xs",
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      full: "max-w-none",
    },
    defaultVariants: {
      size: "md",
    },
  },
});

export const overlayVariant = cva("", {
  variants: {
    skrim: {
      dark: "bg-black/80",
      light: "bg-white/80",
    },
    defaultVariants: {
      skrim: "dark",
    },
  },
});

export default {
  drawer: {
    container: containerVariant,
    overlay: overlayVariant,
  },
};
