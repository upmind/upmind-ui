import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  tabs: {
    root: cva(
      "inline-flex space-x-1 rounded-lg bg-base-100 p-1 p-1 transition hover:bg-base-200",
      {
        variants: {
          align: {
            start: "justify-start",
            center: "justify-center",
            end: "justify-end",
            between: "justify-between",
            around: "justify-around",
            evenly: "justify-evenly",
          },
          isBlock: {
            true: "flex w-full",
            false: "inline-flex",
          },
          isDisabled: {
            true: "cursor-not-allowed opacity-50",
          },
          isProcessing: {
            true: "cursor-wait",
          },
        },
        defaultVariants: { align: "start", isBlock: false },
      }
    ),
  },
  tab: {
    root: cva(
      "flex items-center gap-x-2 rounded-lg bg-transparent leading-none text-base-foreground transition duration-300 hover:bg-base-100",
      {
        variants: {
          size: {
            sm: "px-4 py-3 text-sm",
            md: "px-8 py-3",
            lg: "px-12 py-3 text-lg",
          },
          isActive: {
            true: "bg-base shadow hover:bg-base hover:text-base-foreground",
          },
          isStretched: {
            true: "flex-1",
          },
          isDisabled: {
            true: "!cursor-not-allowed !bg-transparent opacity-50",
          },
        },
        defaultVariants: { size: "md" },
      }
    ),
    icon: cva("size-6"),
    label: cva("flex-1 tracking-wide", {
      variants: {
        isActive: {
          true: "font-semibold",
        },
      },
    }),
  },
};
