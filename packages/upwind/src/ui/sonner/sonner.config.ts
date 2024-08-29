import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const sonnerConfig = {
  base: {
    toast: cva(
      "toast group-[.toaster]:border-border group group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg"
    ),
    title: cva("font-semibold"),
    description: cva("group-[.toast]:text-muted-foreground"),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=base]:bg-base-foreground group-data-[type=base]:text-base-background group-data-[type=base]:hover:bg-base-800"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=base]:!bg-base-50 group-data-[type=base]:!text-base-foreground group-data-[type=base]:hover:!bg-base-50"
    ),
  },
  primary: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=primary]:border-primary-200 group-[.toaster]:data-[type=primary]:bg-primary-50 group-[.toaster]:data-[type=primary]:text-primary"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=primary]:bg-primary group-data-[type=primary]:text-primary-foreground group-data-[type=primary]:hover:bg-primary-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=primary]:!border-primary-200 group-data-[type=primary]:!bg-primary-50 group-data-[type=primary]:!text-primary group-data-[type=primary]:hover:!border-primary-200 group-data-[type=primary]:hover:!bg-primary-50"
    ),
  },
  secondary: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=secondary]:border-secondary-200 group-[.toaster]:data-[type=secondary]:bg-secondary-50 group-[.toaster]:data-[type=secondary]:text-secondary"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=secondary]:bg-secondary group-data-[type=secondary]:text-secondary-foreground group-data-[type=secondary]:hover:bg-secondary-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=secondary]:!border-secondary-200 group-data-[type=secondary]:!bg-secondary-50 group-data-[type=secondary]:!text-secondary group-data-[type=secondary]:hover:!border-secondary-200 group-data-[type=secondary]:hover:!bg-secondary-50"
    ),
  },
  accent: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=accent]:border-accent-200 group-[.toaster]:data-[type=accent]:bg-accent-50 group-[.toaster]:data-[type=accent]:text-accent"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=accent]:bg-accent group-data-[type=accent]:text-accent-foreground group-data-[type=accent]:hover:bg-accent-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=accent]:!border-accent-200 group-data-[type=accent]:!bg-accent-50 group-data-[type=accent]:!text-accent group-data-[type=accent]:hover:!border-accent-200 group-data-[type=accent]:hover:!bg-accent-50"
    ),
  },
  success: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=success]:border-success-200 group-[.toaster]:data-[type=success]:bg-success-50 group-[.toaster]:data-[type=success]:text-success"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=success]:bg-success group-data-[type=success]:text-success-foreground group-data-[type=success]:hover:bg-success-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=success]:!border-success-200 group-data-[type=success]:!bg-success-50 group-data-[type=success]:!text-success group-data-[type=success]:hover:!border-success-200 group-data-[type=success]:hover:!bg-success-50"
    ),
  },
  error: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=error]:border-error-200 group-[.toaster]:data-[type=error]:bg-error-50 group-[.toaster]:data-[type=error]:text-error"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=error]:bg-error group-data-[type=error]:text-error-foreground group-data-[type=error]:hover:bg-error-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=error]:!border-error-200 group-data-[type=error]:!bg-error-50 group-data-[type=error]:!text-error group-data-[type=error]:hover:!border-error-200 group-data-[type=error]:hover:!bg-error-50"
    ),
  },
  warning: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=warning]:border-warning-200 group-[.toaster]:data-[type=warning]:bg-warning-50 group-[.toaster]:data-[type=warning]:text-warning"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=warning]:bg-warning group-data-[type=warning]:text-warning-foreground group-data-[type=warning]:hover:bg-warning-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=warning]:!border-warning-200 group-data-[type=warning]:!bg-warning-50 group-data-[type=warning]:!text-warning group-data-[type=warning]:hover:!border-warning-200 group-data-[type=warning]:hover:!bg-warning-50"
    ),
  },
  info: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=info]:border-info-200 group-[.toaster]:data-[type=info]:bg-info-50 group-[.toaster]:data-[type=info]:text-info"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=info]:bg-info group-data-[type=info]:text-info-foreground group-data-[type=info]:hover:bg-info-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=info]:!border-info-200 group-data-[type=info]:!bg-info-50 group-data-[type=info]:!text-info group-data-[type=info]:hover:!border-info-200 group-data-[type=info]:hover:!bg-info-50"
    ),
  },
  promotion: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=promotion]:border-promotion-200 group-[.toaster]:data-[type=promotion]:bg-promotion-50 group-[.toaster]:data-[type=promotion]:text-promotion"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=promotion]:bg-promotion group-data-[type=promotion]:text-promotion-foreground group-data-[type=promotion]:hover:bg-promotion-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=promotion]:!border-promotion-200 group-data-[type=promotion]:!bg-promotion-50 group-data-[type=promotion]:!text-promotion group-data-[type=promotion]:hover:!border-promotion-200 group-data-[type=promotion]:hover:!bg-promotion-50"
    ),
  },
  destructive: {
    toast: cva(
      "group-[.toaster]:shadow-lg group-[.toaster]:data-[type=destructive]:border-destructive-200 group-[.toaster]:data-[type=destructive]:bg-destructive-50 group-[.toaster]:data-[type=destructive]:text-destructive"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "!transition-all !duration-300 group-data-[type=destructive]:bg-destructive group-data-[type=destructive]:text-destructive-foreground group-data-[type=destructive]:hover:bg-destructive-400"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "!transition-all !duration-300 group-data-[type=destructive]:!border-destructive-200 group-data-[type=destructive]:!bg-destructive-50 group-data-[type=destructive]:!text-destructive group-data-[type=destructive]:hover:!border-destructive-200 group-data-[type=destructive]:hover:!bg-destructive-50"
    ),
  },
};

export default {
  sonner: sonnerConfig,
};
