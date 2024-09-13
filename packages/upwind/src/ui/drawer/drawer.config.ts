import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const drawer = {
  overlay: cva("fixed inset-0 z-50 bg-black/80"),
  content: cva(
    "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background"
  ),
  container: cva("mx-auto w-full", {
    variants: {
      maxWidth: {
        xs: "max-w-xs",
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
      },
    },
  }),
  header: cva("grid gap-1.5 p-4 text-center sm:text-left"),
  handle: cva("mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"),
  title: cva("text-lg font-semibold leading-none tracking-tight"),
  description: cva("text-sm text-muted-foreground"),
  footer: cva("mt-auto flex flex-col gap-2 p-4"),
};

export default {
  drawer,
};
