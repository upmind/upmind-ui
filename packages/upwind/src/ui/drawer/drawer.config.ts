import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const containerVariant = cva("mx-auto w-full ", {
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
      app: "max-w-app",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "app",
  },
});

export const contentVariant = cva("mx-auto  w-full ", {
  variants: {
    fit: {
      cover: "p-0",
      contain: "p-6",
    },
  },
  defaultVariants: {
    fit: "contain",
  },
});

export const innerVariant = cva("mx-auto max-h-[75vh] w-full ", {
  variants: {
    size: {
      xs: "",
      sm: "",
      md: "",
      lg: "",
      xl: "",
      "2xl": "",
      "3xl": "",
      "4xl": "",
      app: "",
      full: "",
    },
    overflow: {
      auto: "overflow-auto",
      hidden: "overflow-hidden",
      visible: "overflow-visible",
      scroll: "overflow-scroll",
    },
  },
  defaultVariants: {
    size: "app",
    overflow: "auto",
  },
});

export const overlayVariant = cva("", {
  variants: {
    skrim: {
      dark: "bg-black/80",
      light: "bg-white/80",
      primary: "bg-primary-950/90",
      secondary: "bg-secondary-950/90",
      accent: "bg-accent-950/90",
    },
    defaultVariants: {
      skrim: "dark",
    },
  },
});

export default {
  drawer: {
    overlay: overlayVariant,
    container: containerVariant,
    content: contentVariant,
    inner: innerVariant,
    header: "",
    footer: "",
  },
};
