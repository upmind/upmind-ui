// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const tooltipConfig = cva(
  "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-base-800 z-50 overflow-hidden rounded px-3 py-1.5 text-sm text-white",
  {
    variants: {
      color: {
        base: "bg-base-800 text-base-50",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        promotion: "bg-promotion text-promotion-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        info: "bg-info text-info-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground",
      },
    },
  }
);

export const arrowConfig = cva("text-base-800", {
  variants: {
    color: {
      base: "text-base-800",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      promotion: "text-promotion",
      destructive: "text-destructive",
      success: "text-success",
      info: "text-info",
      error: "text-error",
      warning: "text-warning",
    },
  },
});
// -----------------------------------------------------------------------------

export default {
  tooltip: {
    content: tooltipConfig,
    arrow: arrowConfig,
  },
};
