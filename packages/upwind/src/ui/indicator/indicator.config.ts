// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const indicatorConfig = cva(
  "absolute right-0 top-0 inline-flex shrink-0 select-none items-center justify-center overflow-hidden p-1 text-xs font-normal",

  {
    variants: {
      color: {
        base: "bg-base-200 text-base-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        promotion: "bg-promotion text-promotion-foreground",
        destructive: "bg-error text-error-foreground",
        success: "bg-success text-success-foreground",
        info: "bg-info text-info-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground",
      },
      size: {
        full: "size-4 ",
        dot: "h-1 w-1",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      color: "base",
      size: "full",
      shape: "circle",
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  indicator: {
    root: indicatorConfig,
    icon: {
      root: cva("h-full w-full object-cover p-[0.5em]"),
    },
    value: cva("text-center"),
  },
};
