import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

const toastConfig = cva(
  "group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:shadow-lg",
  {
    variants: {
      type: {
        base: "",
        primary:
          "group-[.toaster]:data-[type=primary]:bg-primary-50 group-[.toaster]:data-[type=primary]:border-primary-200 group-[.toaster]:data-[type=primary]:text-primary",
        secondary:
          "group-[.toaster]:data-[type=secondary]:bg-secondary-50 group-[.toaster]:data-[type=secondary]:border-secondary-200 group-[.toaster]:data-[type=secondary]:text-secondary",
        accent:
          "group-[.toaster]:data-[type=accent]:bg-accent-50 group-[.toaster]:data-[type=accent]:border-accent-200 group-[.toaster]:data-[type=accent]:text-accent",
        success:
          "group-[.toaster]:data-[type=success]:border-success-200 group-[.toaster]:data-[type=success]:bg-success-50 group-[.toaster]:data-[type=success]:text-success",
        error:
          "group-[.toaster]:data-[type=error]:border-error-200 group-[.toaster]:data-[type=error]:bg-error-50 group-[.toaster]:data-[type=error]:text-error",
        warning:
          "group-[.toaster]:data-[type=warning]:border-warning-200 group-[.toaster]:data-[type=warning]:bg-warning-50 group-[.toaster]:data-[type=warning]:text-warning",
        info: "group-[.toaster]:data-[type=info]:border-info-200 group-[.toaster]:data-[type=info]:bg-info-50 group-[.toaster]:data-[type=info]:text-info",
        promotion:
          "group-[.toaster]:data-[type=promotion]:border-promotion-200 group-[.toaster]:data-[type=promotion]:bg-promotion-50 group-[.toaster]:data-[type=promotion]:text-promotion",
        destructive:
          "group-[.toaster]:data-[type=destructive]:bg-destructive-50 group-[.toaster]:data-[type=destructive]:border-destructive-200 group-[.toaster]:data-[type=destructive]:text-destructive",
      },
    },
    defaultVariants: {
      type: "base",
    },
  }
);
const titleConfig = cva("font-semibold");
const descriptionConfig = cva("group-[.toast]:text-muted-foreground");
const actionButtonConfig = cva("!transition-all !duration-300", {
  variants: {
    type: {
      base: "group-data-[type=base]:hover:bg-base-800 group-data-[type=base]:bg-base-foreground group-data-[type=base]:text-base-background",
      primary:
        "group-data-[type=primary]:hover:bg-primary-400 group-data-[type=primary]:bg-primary group-data-[type=primary]:text-primary-foreground",
      secondary:
        "group-data-[type=secondary]:hover:bg-secondary-400 group-data-[type=secondary]:bg-secondary group-data-[type=secondary]:text-secondary-foreground",
      accent:
        "group-data-[type=accent]:hover:bg-accent-400 group-data-[type=accent]:bg-accent group-data-[type=accent]:text-accent-foreground",
      success:
        "group-data-[type=success]:hover:bg-success-400 group-data-[type=success]:bg-success group-data-[type=success]:text-success-foreground",
      error:
        "group-data-[type=error]:hover:bg-error-400 group-data-[type=error]:bg-error group-data-[type=error]:text-error-foreground",
      warning:
        "group-data-[type=warning]:hover:bg-warning-400 group-data-[type=warning]:bg-warning group-data-[type=warning]:text-warning-foreground",
      info: "group-data-[type=info]:hover:bg-info-400 group-data-[type=info]:bg-info group-data-[type=info]:text-info-foreground",
      promotion:
        "group-data-[type=promotion]:hover:bg-promotion-400 group-data-[type=promotion]:bg-promotion group-data-[type=promotion]:text-promotion-foreground",
      destructive:
        "group-data-[type=destructive]:hover:bg-destructive-400 group-data-[type=destructive]:bg-destructive group-data-[type=destructive]:text-destructive-foreground",
    },
  },
});
const cancelButtonConfig = cva("");
const closeButtonConfig = cva("!transition-all !duration-300", {
  variants: {
    type: {
      base: "group-data-[type=base]:!bg-base-50 group-data-[type=base]:hover:!bg-base-50 group-data-[type=base]:!text-base-foreground",
      primary:
        "group-data-[type=primary]:!bg-primary-50 group-data-[type=primary]:hover:!bg-primary-50 group-data-[type=primary]:!border-primary-200 group-data-[type=primary]:hover:!border-primary-200 group-data-[type=primary]:!text-primary",
      secondary:
        "group-data-[type=secondary]:!bg-secondary-50 group-data-[type=secondary]:hover:!bg-secondary-50 group-data-[type=secondary]:!border-secondary-200 group-data-[type=secondary]:hover:!border-secondary-200 group-data-[type=secondary]:!text-secondary",
      accent:
        "group-data-[type=accent]:!bg-accent-50 group-data-[type=accent]:hover:!bg-accent-50 group-data-[type=accent]:!border-accent-200 group-data-[type=accent]:hover:!border-accent-200 group-data-[type=accent]:!text-accent",
      success:
        "group-data-[type=success]:!border-success-200 group-data-[type=success]:hover:!border-success-200 group-data-[type=success]:!bg-success-50 group-data-[type=success]:hover:!bg-success-50 group-data-[type=success]:!text-success",
      error:
        "group-data-[type=error]:!border-error-200 group-data-[type=error]:hover:!border-error-200 group-data-[type=error]:!bg-error-50 group-data-[type=error]:hover:!bg-error-50 group-data-[type=error]:!text-error",
      warning:
        "group-data-[type=warning]:!border-warning-200 group-data-[type=warning]:hover:!border-warning-200 group-data-[type=warning]:!bg-warning-50 group-data-[type=warning]:hover:!bg-warning-50 group-data-[type=warning]:!text-warning",
      info: "group-data-[type=info]:!border-info-200 group-data-[type=info]:hover:!border-info-200 group-data-[type=info]:!bg-info-50 group-data-[type=info]:hover:!bg-info-50 group-data-[type=info]:!text-info",
      promotion:
        "group-data-[type=promotion]:!border-promotion-200 group-data-[type=promotion]:hover:!border-promotion-200 group-data-[type=promotion]:!bg-promotion-50 group-data-[type=promotion]:hover:!bg-promotion-50 group-data-[type=promotion]:!text-promotion",
      destructive:
        "group-data-[type=destructive]:!bg-destructive-50 group-data-[type=destructive]:hover:!bg-destructive-50 group-data-[type=destructive]:!border-destructive-200 group-data-[type=destructive]:hover:!border-destructive-200 group-data-[type=destructive]:!text-destructive",
    },
  },
});

// -----------------------------------------------------------------------------
export default {
  toast: {
    root: toastConfig,
    title: titleConfig,
    description: descriptionConfig,
    actionButton: actionButtonConfig,
    cancelButton: cancelButtonConfig,
    closeButton: closeButtonConfig,
  },
};
