import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const rootVariants = cva(
  "bg-control-background aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2 hover:border-control-strong focus-visible:ring-ring flex rounded-lg border border-control text-control-foreground shadow-none ring-offset-background transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      width: {
        auto: "w-auto min-w-[3.75rem]",
        full: "w-full"
      },
      size: {
        sm: "px-2 py-2 text-sm",
        md: "px-3 py-2 text-md",
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
