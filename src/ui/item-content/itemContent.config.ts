import { cva } from "class-variance-authority";

export default {
  itemContent: {
    root: cva("flex flex-1 flex-wrap items-start gap-x-4 gap-y-1"),
    content: cva("flex min-w-40 flex-1 flex-col items-start gap-4"),
    group: cva("flex w-full shrink-0 flex-col gap-1"),
    header: {
      root: cva("flex w-full shrink-0 flex-wrap items-center gap-x-4 gap-y-1"),
      primary: cva("flex flex-1 items-center gap-2"),
      secondary: cva("flex shrink-0 items-center gap-2"),
      action: cva("leading-none font-normal")
    },
    label: cva("text-md-tight text-display font-medium"),
    secondaryLabel: cva("text-md-tight text-display font-medium"),
    description: cva("text-sm-tight w-full text-base font-normal"),
    secondaryDescription: cva("text-muted text-sm-tight w-full font-normal")
  }
};
