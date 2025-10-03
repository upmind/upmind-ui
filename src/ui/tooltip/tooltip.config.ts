// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const variants = {
  color: {
    neutral: "bg-accent-neutral text-accent-neutral-contrast",
    promo: "bg-accent-promo text-accent-promo-contrast",
    danger: "bg-accent-danger text-accent-danger-contrast",
    warning: "bg-accent-warning text-accent-warning-contrast",
    success: "bg-accent-success text-accent-success-contrast",
    info: "bg-accent-info text-accent-info-contrast"
  }
};

export const contentVariants = cva(
  "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-xs border-transparent px-3 py-1.5 text-sm ring-0 ring-transparent focus:ring-0 focus-visible:ring-0 focus-within:ring-0 outline-none",
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
      neutral: "text-accent-neutral",
      promo: "text-accent-promo",
      danger: "text-accent-danger",
      warning: "text-accent-warning",
      success: "text-accent-success",
      info: "text-accent-info",
      error: "text-accent-error"
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
    trigger: cva("text-inherit no-underline ring-0 ring-transparent focus:ring-0 focus-visible:ring-0 focus-within:ring-0 outline-none")
  }
};
