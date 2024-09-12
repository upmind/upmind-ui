import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const dialogConfig = cva(
  "border-border relative z-50 my-8 grid w-full gap-4 border bg-background shadow-lg duration-200 sm:rounded-lg md:w-full",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        full: "max-w-full",
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
  }
);

export const headerConfig = cva(
  "flex flex-col gap-y-2 text-center sm:text-left"
);

export const titleConfig = cva(
  "text-lg font-semibold leading-none tracking-tight"
);

export const descriptionConfig = cva("mt-2 text-sm text-muted-foreground");

export const footerConfig = cva(
  "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2"
);

export const closeConfig = cva(
  "absolute right-3 top-3 rounded-md p-0.5 transition-colors"
);

export const closeIconConfig = cva("h-3 w-3");

export const overlayConfig = cva(
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 grid place-items-center overflow-y-auto ",
  {
    variants: {
      skrim: {
        dark: "bg-black/80",
        light: "bg-white/80",
        none: "bg-transparent",
      },
    },
    defaultVariants: {
      skrim: "dark",
    },
  }
);

export default {
  dialog: {
    content: dialogConfig,
    header: headerConfig,
    title: titleConfig,
    description: descriptionConfig,
    footer: footerConfig,
    close: closeConfig,
    closeIcon: closeIconConfig,
    overlay: overlayConfig,
  },
};
