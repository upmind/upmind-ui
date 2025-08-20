import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const rootVariants = cva(
  "bg-control-background text-md aria-invalid:ring-invalid! hover:border-control-strong focus-visible:ring-ring border-control text-control-foreground ring-offset-background placeholder:text-muted-foreground border-control flex rounded px-4 py-2 shadow-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2! aria-invalid:ring-offset-2!",
  {
    variants: {
      width: {
        auto: "w-auto min-w-15",
        full: "w-full"
      }
    },
    defaultVariants: {
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
    item: cva(
      "focus:bg-control-active-hover focus:text-control-foreground text-md"
    )
  }
};
