import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  tabs: {
    root: cva(
      "bg-base-100 hover:bg-base-200 inline-flex space-x-1 rounded-lg p-1 p-1 transition",
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
      "text-base-content hover:bg-base-100 flex items-center gap-x-2 rounded-lg bg-transparent leading-none transition duration-300",
      {
        variants: {
          size: {
            sm: "px-4 py-3 text-sm",
            md: "px-8 py-3",
            lg: "px-12 py-3 text-lg",
          },
          isActive: {
            true: "bg-base hover:text-base-content hover:bg-base shadow",
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
