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
  "bg-surface border-surface card-radius mx-auto grid max-h-[90dvh] w-full border p-0 text-base shadow-none focus:outline-hidden",
  {
    variants,
    defaultVariants: {
      size: "app",
      overflow: "auto",
      fit: "contain"
    }
  }
);

export const overlayVariant = cva("bg-overlay");

export default {
  dialog: {
    content: contentVariant,
    container: cva("flex flex-col justify-start"),
    overlay: overlayVariant,
    header: cva(""),
    footer: cva("")
  }
};
