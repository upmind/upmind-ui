import { cva } from "class-variance-authority";

export const variants = {
  variant: {
    minimal: "bg-background-surface border-[1.5px]",
    muted: ""
  },
  size: {
    sm: "p-4",
    md: "px-4 py-5"
  },
  color: {
    neutral: "",
    promo: "",
    danger: "",
    warning: "",
    success: "",
    info: ""
  }
};

export const alertVariants = cva("message-radius", {
  variants,
  defaultVariants: {
    variant: "minimal",
    color: "neutral",
    size: "md"
  },
  compoundVariants: [
    // Minimal
    {
      variant: "minimal",
      color: "neutral",
      class: "border-border-accent-neutral"
    },
    {
      variant: "minimal",
      color: "promo",
      class: "border-border-accent-promo"
    },
    {
      variant: "minimal",
      color: "danger",
      class: "border-border-accent-danger"
    },
    {
      variant: "minimal",
      color: "warning",
      class: "border-border-accent-warning"
    },
    {
      variant: "minimal",
      color: "success",
      class: "border-border-accent-success"
    },
    {
      variant: "minimal",
      color: "info",
      class: "border-border-accent-info"
    },
    // Muted
    {
      variant: "muted",
      color: "neutral",
      class:
        "bg-background-accent-neutral-muted text-text-accent-neutral-muted-contrast"
    },
    {
      variant: "muted",
      color: "promo",
      class:
        "bg-background-accent-promo-muted text-text-accent-promo-muted-contrast"
    },
    {
      variant: "muted",
      color: "danger",
      class:
        "bg-background-accent-danger-muted text-text-accent-danger-muted-contrast"
    },
    {
      variant: "muted",
      color: "warning",
      class:
        "bg-background-accent-warning-muted text-text-accent-warning-muted-contrast"
    },
    {
      variant: "muted",
      color: "success",
      class:
        "bg-background-accent-success-muted text-text-accent-success-muted-contrast"
    },
    {
      variant: "muted",
      color: "info",
      class:
        "bg-background-accent-info-muted text-text-accent-info-muted-contrast"
    }
  ]
});

// -----------------------------------------------------------------------------
export default {
  alert: alertVariants
};
