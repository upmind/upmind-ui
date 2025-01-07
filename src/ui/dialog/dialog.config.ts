import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const contentVariant = cva(
  "mx-auto max-h-[90dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] bg-base-background p-0 focus:outline-none",
  {
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
      size: "app",
      overflow: "auto",
      fit: "contain",
    },
  }
);

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
  dialog: {
    content: contentVariant,
    overlay: overlayVariant,
  },
};
