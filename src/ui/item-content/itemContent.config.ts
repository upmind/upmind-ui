import { cva } from "class-variance-authority";

export default {
  itemContent: {
    root: cva("flex flex-col gap-1"),
    header: {
      root: cva("flex w-full items-start justify-between gap-4"),
      primary: cva("flex flex-1 items-center gap-2"),
      secondary: cva("flex items-center gap-2"),
      action: cva("leading-none font-normal")
    },
    label: cva("text-md-tight text-display font-medium"),
    secondaryLabel: cva("text-md-tight text-display font-medium"),
    description: cva("text-sm-tight text-base font-normal"),
    secondaryDescription: cva("text-muted text-sm-tight font-normal")
  }
};
