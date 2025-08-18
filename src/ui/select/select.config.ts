import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const rootVariants = cva(
  "bg-control-background aria-invalid:ring-invalid! hover:border-control-strong focus-visible:ring-ring border-control text-control-foreground ring-offset-background placeholder:text-muted-foreground aria-invalid:ring-2! aria-invalid:ring-offset-2! flex rounded border shadow-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      width: {
        auto: "min-w-15 w-auto",
        full: "w-full"
      },
      size: {
        sm: "px-2 py-2 text-sm",
        md: "text-md px-3 py-2",
        lg: "px-3 py-2 text-lg"
      }
    },
    defaultVariants: {
      size: "md",
      width: "full"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  select: {
    root: rootVariants,
    value: cva("text-control-foreground", {
      variants: {
        hasValue: {
          true: "",
          false: "text-emphasis-disabled"
        }
      }
    }),
    item: cva("focus:bg-control-active-hover focus:text-control-foreground")
  }
};
