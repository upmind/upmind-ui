import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  tabs: {
    root: cva(
      "bg-base-100 hover:bg-base-200 inline-flex space-x-1 self-start justify-self-start rounded-lg p-1 p-1 transition"
    ),
  },
  tab: {
    root: cva(
      "text-base-content hover:text-primary inline-flex items-center gap-x-2 rounded-lg bg-transparent leading-none",
      {
        variants: {
          size: {
            sm: "px-4 py-3 text-sm",
            md: "px-8 py-3",
            lg: "px-12 py-3 text-lg",
          },
          isActive: {
            true: "bg-base hover:text-base-content shadow",
          },
          isDisabled: {
            true: "pointer-events-none opacity-50",
          },
        },
        defaultVariants: { size: "md" },
      }
    ),
    icon: cva("size-6"),
    label: cva("tracking-wide", {
      variants: {
        isActive: {
          true: "font-semibold",
        },
      },
    }),
  },
};
