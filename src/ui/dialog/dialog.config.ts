import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const variants = {
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
    full: "max-w-none"
  },
  overflow: {
    auto: "overflow-auto",
    hidden: "overflow-hidden",
    visible: "overflow-visible",
    scroll: "overflow-scroll"
  },
  fit: {
    cover: "border-none p-0",
    contain: "p-6 md:p-10"
  }
};

export const contentVariant = cva(
  "bg-surface border-surface sm:card-radius mx-auto flex max-h-[90dvh] w-full flex-col border p-0 text-base shadow-none focus:outline-hidden",
  {
    variants: {
      size: variants.size
    },
    defaultVariants: {
      size: "app"
    }
  }
);

export const scrollableVariant = cva("flex min-h-0 flex-1 flex-col gap-4", {
  variants: {
    overflow: variants.overflow,
    fit: variants.fit
  },
  defaultVariants: {
    overflow: "auto",
    fit: "contain"
  }
});

export const overlayVariant = cva("bg-overlay");

export default {
  dialog: {
    content: contentVariant,
    scrollable: scrollableVariant,
    container: cva("flex flex-col justify-start"),
    overlay: overlayVariant,
    header: cva(""),
    footer: cva("")
  }
};
