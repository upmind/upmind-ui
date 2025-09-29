// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const variants = {
  color: {
    neutral: "bg-background-accent-neutral text-text-accent-neutral-contrast",
    promo: "bg-background-accent-promo text-text-accent-promo-contrast",
    danger: "bg-background-accent-danger text-text-accent-danger-contrast",
    warning: "bg-background-accent-warning text-text-accent-warning-contrast",
    success: "bg-background-accent-success text-text-accent-success-contrast",
    info: "bg-background-accent-info text-text-accent-info-contrast"
  }
};

export const contentVariants = cva(
  "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-xs border-transparent px-3 py-1.5 text-sm",
  {
    variants,
    defaultVariants: {
      color: "neutral"
    }
  }
);

export const arrowVariants = cva("", {
  variants: {
    color: {
      neutral: "text-text-accent-neutral",
      promo: "text-text-accent-promo",
      danger: "text-text-accent-danger",
      warning: "text-text-accent-warning",
      success: "text-text-accent-success",
      info: "text-text-accent-info",
      error: "text-text-accent-error"
    }
  },
  defaultVariants: {
    color: "neutral"
  }
});

// -----------------------------------------------------------------------------

export default {
  tooltip: {
    content: contentVariants,
    arrow: arrowVariants,
    trigger: cva("text-inherit no-underline")
  }
};
