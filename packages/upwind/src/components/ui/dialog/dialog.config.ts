import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const dialogConfig = {
  content: cva(
    "relative z-50 my-8 grid w-full gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full",
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
      },
      defaultVariants: {
        size: "lg",
        overflow: "visible",
      },
    }
  ),
  overlay: cva(
    "fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
  ),
  header: cva("flex flex-col gap-y-2 text-center sm:text-left"),
  title: cva("text-lg font-semibold leading-none tracking-tight"),
  description: cva("text-sm text-muted-foreground"),
  footer: cva("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2"),
  close: cva("absolute right-3 top-3 rounded-md p-0.5 transition-colors"),
  closeIcon: cva("h-3 w-3"),
};

export default {
  dialog: dialogConfig,
};
