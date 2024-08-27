import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const sonnerConfig = {
  base: {
    toast: cva(
      "toast group group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg"
    ),
    title: cva("font-semibold"),
    description: cva("group-[.toast]:text-muted-foreground"),
    actionButton: cva(
      "group-data-[type=base]:hover:bg-base-800 group-data-[type=base]:bg-base-foreground group-data-[type=base]:text-base-background !transition-all !duration-300"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=base]:!bg-base-50 group-data-[type=base]:hover:!bg-base-50 group-data-[type=base]:!text-base-foreground !transition-all !duration-300"
    ),
  },
  primary: {
    toast: cva(
      "group-[.toaster]:data-[type=primary]:bg-primary-50 group-[.toaster]:data-[type=primary]:border-primary-200 group-[.toaster]:shadow-lg group-[.toaster]:data-[type=primary]:text-primary"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=primary]:hover:bg-primary-400 !transition-all !duration-300 group-data-[type=primary]:bg-primary group-data-[type=primary]:text-primary-foreground"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=primary]:!bg-primary-50 group-data-[type=primary]:hover:!bg-primary-50 group-data-[type=primary]:!border-primary-200 group-data-[type=primary]:hover:!border-primary-200 !transition-all !duration-300 group-data-[type=primary]:!text-primary"
    ),
  },
  secondary: {
    toast: cva(
      "group-[.toaster]:data-[type=secondary]:bg-secondary-50 group-[.toaster]:data-[type=secondary]:border-secondary-200 group-[.toaster]:shadow-lg group-[.toaster]:data-[type=secondary]:text-secondary"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=secondary]:hover:bg-secondary-400 !transition-all !duration-300 group-data-[type=secondary]:bg-secondary group-data-[type=secondary]:text-secondary-foreground"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=secondary]:!bg-secondary-50 group-data-[type=secondary]:hover:!bg-secondary-50 group-data-[type=secondary]:!border-secondary-200 group-data-[type=secondary]:hover:!border-secondary-200 !transition-all !duration-300 group-data-[type=secondary]:!text-secondary"
    ),
  },
  accent: {
    toast: cva(
      "group-[.toaster]:data-[type=accent]:bg-accent-50 group-[.toaster]:data-[type=accent]:border-accent-200 group-[.toaster]:shadow-lg group-[.toaster]:data-[type=accent]:text-accent"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=accent]:hover:bg-accent-400 !transition-all !duration-300 group-data-[type=accent]:bg-accent group-data-[type=accent]:text-accent-foreground"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=accent]:!bg-accent-50 group-data-[type=accent]:hover:!bg-accent-50 group-data-[type=accent]:!border-accent-200 group-data-[type=accent]:hover:!border-accent-200 !transition-all !duration-300 group-data-[type=accent]:!text-accent"
    ),
  },
  success: {
    toast: cva(
      "group-[.toaster]:data-[type=success]:border-success-200 group-[.toaster]:data-[type=success]:bg-success-50 group-[.toaster]:data-[type=success]:text-success group-[.toaster]:shadow-lg"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=success]:hover:bg-success-400 group-data-[type=success]:bg-success group-data-[type=success]:text-success-foreground !transition-all !duration-300"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=success]:!border-success-200 group-data-[type=success]:hover:!border-success-200 group-data-[type=success]:!bg-success-50 group-data-[type=success]:hover:!bg-success-50 group-data-[type=success]:!text-success !transition-all !duration-300"
    ),
  },
  error: {
    toast: cva(
      "group-[.toaster]:data-[type=error]:border-error-200 group-[.toaster]:data-[type=error]:bg-error-50 group-[.toaster]:data-[type=error]:text-error group-[.toaster]:shadow-lg"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=error]:hover:bg-error-400 group-data-[type=error]:bg-error group-data-[type=error]:text-error-foreground !transition-all !duration-300"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=error]:!border-error-200 group-data-[type=error]:hover:!border-error-200 group-data-[type=error]:!bg-error-50 group-data-[type=error]:hover:!bg-error-50 group-data-[type=error]:!text-error !transition-all !duration-300"
    ),
  },
  warning: {
    toast: cva(
      "group-[.toaster]:data-[type=warning]:border-warning-200 group-[.toaster]:data-[type=warning]:bg-warning-50 group-[.toaster]:data-[type=warning]:text-warning group-[.toaster]:shadow-lg"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=warning]:hover:bg-warning-400 group-data-[type=warning]:bg-warning group-data-[type=warning]:text-warning-foreground !transition-all !duration-300"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=warning]:!border-warning-200 group-data-[type=warning]:hover:!border-warning-200 group-data-[type=warning]:!bg-warning-50 group-data-[type=warning]:hover:!bg-warning-50 group-data-[type=warning]:!text-warning !transition-all !duration-300"
    ),
  },
  info: {
    toast: cva(
      "group-[.toaster]:data-[type=info]:border-info-200 group-[.toaster]:data-[type=info]:bg-info-50 group-[.toaster]:data-[type=info]:text-info group-[.toaster]:shadow-lg"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=info]:hover:bg-info-400 group-data-[type=info]:bg-info group-data-[type=info]:text-info-foreground !transition-all !duration-300"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=info]:!border-info-200 group-data-[type=info]:hover:!border-info-200 group-data-[type=info]:!bg-info-50 group-data-[type=info]:hover:!bg-info-50 group-data-[type=info]:!text-info !transition-all !duration-300"
    ),
  },
  promotion: {
    toast: cva(
      "group-[.toaster]:data-[type=promotion]:border-promotion-200 group-[.toaster]:data-[type=promotion]:bg-promotion-50 group-[.toaster]:data-[type=promotion]:text-promotion group-[.toaster]:shadow-lg"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=promotion]:hover:bg-promotion-400 group-data-[type=promotion]:bg-promotion group-data-[type=promotion]:text-promotion-foreground !transition-all !duration-300"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=promotion]:!border-promotion-200 group-data-[type=promotion]:hover:!border-promotion-200 group-data-[type=promotion]:!bg-promotion-50 group-data-[type=promotion]:hover:!bg-promotion-50 group-data-[type=promotion]:!text-promotion !transition-all !duration-300"
    ),
  },
  destructive: {
    toast: cva(
      "group-[.toaster]:data-[type=destructive]:bg-destructive-50 group-[.toaster]:data-[type=destructive]:border-destructive-200 group-[.toaster]:shadow-lg group-[.toaster]:data-[type=destructive]:text-destructive"
    ),
    title: cva(""),
    description: cva(""),
    actionButton: cva(
      "group-data-[type=destructive]:hover:bg-destructive-400 !transition-all !duration-300 group-data-[type=destructive]:bg-destructive group-data-[type=destructive]:text-destructive-foreground"
    ),
    cancelButton: cva(""),
    closeButton: cva(
      "group-data-[type=destructive]:!bg-destructive-50 group-data-[type=destructive]:hover:!bg-destructive-50 group-data-[type=destructive]:!border-destructive-200 group-data-[type=destructive]:hover:!border-destructive-200 !transition-all !duration-300 group-data-[type=destructive]:!text-destructive"
    ),
  },
};

export default {
  sonner: sonnerConfig,
};
