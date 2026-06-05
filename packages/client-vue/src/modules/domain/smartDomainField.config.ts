import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  field: {
    root: cva("flex w-full flex-col gap-1"),
    container: cva(
      "bg-control-surface border-control-default control-radius border py-1 data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
    ),
    content: cva("flex w-full flex-col items-start gap-1 px-4 py-3"),
    option: cva("flex w-fit cursor-pointer items-start gap-3"),
    indicator: cva("flex h-7 items-center"),
    label: cva("cursor-pointer text-base leading-7 font-medium"),
    expanded: cva("flex w-full flex-col gap-1 py-2 pl-7", {
      variants: {
        hasInfo: {
          true: "gap-3",
          false: ""
        }
      }
    }),
    domain: cva("px-0 md:px-0"),

    transfer: {
      root: cva(
        "flex w-full flex-col items-start gap-2 lg:flex-row lg:flex-wrap lg:gap-x-12 lg:gap-y-2"
      ),
      text: cva("text-muted flex-1 text-sm leading-6")
    },

    summary: {
      root: cva(
        "bg-control-surface shadow-control-default control-radius data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
      ),
      row: cva("flex items-start gap-2 p-4 pl-3"),
      indicator: cva("size-lh flex items-center justify-center"),
      content: cva(
        "flex min-w-[160px] flex-1 flex-wrap items-center gap-x-4 gap-y-1"
      ),
      domain: cva("text-display text-base-tight font-medium"),
      change: cva(
        "text-button-muted-link ml-auto shrink-0 cursor-pointer text-sm leading-6 font-normal underline aria-disabled:opacity-100"
      )
    }
  }
};
