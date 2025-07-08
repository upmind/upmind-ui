// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const contentVariants = cva(
  "z-50 overflow-hidden rounded border-transparent px-3 py-1.5 text-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      color: {
        base: "text-base-muted bg-base-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        promotion: "bg-promotion text-promotion-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        info: "bg-info text-info-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground"
      }
    },
    defaultVariants: {
      color: "base"
    }
  }
);

export const arrowVariants = cva("", {
  variants: {
    color: {
      base: "text-base-foreground",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      promotion: "text-promotion",
      destructive: "text-destructive",
      success: "text-success",
      info: "text-info",
      error: "text-error",
      warning: "text-warning"
    }
  },
  defaultVariants: {
    color: "base"
  }
});

// -----------------------------------------------------------------------------

export default {
  tooltip: {
    content: contentVariants,
    arrow: arrowVariants,
    trigger: cva("text-inherit")
  }
};
