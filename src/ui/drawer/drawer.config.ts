import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const containerVariant = cva("mx-auto w-full px-6 pb-6", {
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

export const contentVariant = cva(
  "bg-surface w-full rounded-t-lg border-none text-base",
  {
    variants: {
      height: {
        auto: "",
        fixed: "max-h-[85vh] min-h-[85vh]"
      }
    },
    defaultVariants: {
      height: "auto"
    }
  }
);

export const innerVariant = cva("mx-auto w-full", {
  variants: {
    height: {
      auto: "max-h-[60vh]",
      fixed: "min-h-0 flex-1"
    },
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
    fit: "contain",
    height: "auto"
  }
});

export const overlayVariant = cva("bg-overlay");

export const footerContainerVariant = cva(
  "mx-auto flex w-full items-center justify-between gap-4 px-6 py-6",
  {
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
  }
);

export default {
  drawer: {
    overlay: overlayVariant,
    container: containerVariant,
    content: contentVariant,
    inner: innerVariant,
    header: "",
    footer: {
      root: cva("border-surface border-t pt-0"),
      container: footerContainerVariant
    }
  }
};
