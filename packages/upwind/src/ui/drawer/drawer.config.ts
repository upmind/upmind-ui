import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const contentVariant = cva("mx-auto w-full", {
  variants: {
    size: {
      xs: "max-w-xs",
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      full: "max-w-none",
    },
    overflow: {
      auto: "overflow-auto",
      hidden: "overflow-hidden",
      visible: "overflow-visible",
      scroll: "overflow-scroll",
    },
    fit: {
      cover: "p-0",
      contain: "p-6",
    },
  },
  defaultVariants: {
    size: "lg",
    overflow: "visible",
    fit: "contain",
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
    content: contentVariant,
    overlay: overlayVariant,
  },
};
