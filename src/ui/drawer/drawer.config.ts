import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const containerVariant = cva("mx-auto w-full", {
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
      full: "max-w-none"
    }
  },
  defaultVariants: {
    width: "xs"
  }
});

export const innerVariant = cva("mx-auto max-h-[75vh] w-full", {
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
      full: ""
    },
    overflow: {
      auto: "overflow-auto",
      hidden: "overflow-hidden",
      visible: "overflow-visible",
      scroll: "overflow-scroll"
    },
    fit: {
      cover: "p-0",
      contain: "py-6"
    }
  },
  defaultVariants: {
    width: "app",
    overflow: "auto",
    fit: "contain"
  }
});

export const overlayVariant = cva("bg-background-overlay");

export default {
  drawer: {
    overlay: overlayVariant,
    container: containerVariant,
    content: cva("bg-background-surface w-full rounded-t-lg border-none py-12"),
    inner: innerVariant,
    header: "",
    footer: ""
  }
};
