import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  field: {
    root: cva("flex w-full flex-col gap-1"),
    container: cva(
      "bg-control-surface border-control-default control-radius border py-1"
    ),
    content: cva("flex w-full flex-col items-start gap-1 px-4 py-3"),
    option: cva("flex w-full cursor-pointer items-start gap-3"),
    indicator: cva("flex h-7 items-center"),
    label: cva("text-base leading-7 font-medium"),
    subContent: cva("flex w-full flex-col py-2 pl-7", {
      variants: {
        hasTransferInfo: {
          true: "gap-3",
          false: ""
        }
      }
    }),
    domain: cva("px-0 md:px-0"),

    transfer: {
      root: cva("flex w-full flex-wrap items-start gap-x-12 gap-y-0"),
      text: cva("text-muted flex-1 text-sm leading-6")
    },

    unavailable: cva("text-destructive text-sm"),

    summary: {
      root: cva("bg-control-surface shadow-control-default control-radius"),
      row: cva("flex items-start gap-2 p-4 pl-3"),
      indicator: cva("size-lh flex items-center justify-center"),
      domain: cva("text-display text-base-tight font-medium"),
      change: cva(
        "text-button-muted-link ml-auto shrink-0 cursor-pointer text-sm leading-6 font-normal underline"
      )
    }
  }
};
