import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const containerVariant = cva(" mx-auto w-full ", {
  variants: {
    width: {
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
    width: "app",
  },
});

export const innerVariant = cva("mx-auto max-h-[75vh] w-full ", {
  variants: {
    width: {
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
    fit: {
      cover: "p-0",
      contain: "py-6",
    },
  },
  defaultVariants: {
    width: "app",
    overflow: "visible",
    fit: "contain",
  },
});

export const overlayVariant = cva("", {
  variants: {
    skrim: {
      dark: "bg-base-foreground/75",
      light: "bg-base-foreground/20",
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
    content: cva("w-full"),
    inner: innerVariant,
    header: "",
    footer: "",
  },
};
