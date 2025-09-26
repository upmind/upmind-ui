import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const variants = {
  variant: {
    solid: "",
    minimal: "",
    muted: ""
  },
  color: {
    primary: "",
    neutral: "",
    promo: "",
    danger: "",
    warning: "",
    success: "",
    info: ""
  },
  size: {
    sm: "px-2 py-1 text-xs/tight font-semibold",
    md: "px-3 py-1 text-sm/tight font-medium"
  }
};

export const badgeVariants = cva(
  "badge-radius inline-flex w-fit items-center whitespace-nowrap",
  {
    variants,
    defaultVariants: {
      color: "primary",
      variant: "solid",
      size: "md"
    },
    compoundVariants: [
      // Solid
      {
        variant: "solid",
        color: "primary",
        class:
          "from-primitive-primary-default to-primitive-primary-default-stop text-text-accent-primary-contrast bg-gradient-to-r"
      },
      {
        variant: "solid",
        color: "neutral",
        class: "bg-background-accent-neutral text-text-accent-neutral-contrast"
      },
      {
        variant: "solid",
        color: "promo",
        class: "bg-background-accent-promo text-text-accent-promo-contrast"
      },
      {
        variant: "solid",
        color: "danger",
        class: "bg-background-accent-danger text-text-accent-danger-contrast"
      },
      {
        variant: "solid",
        color: "warning",
        class: "bg-background-accent-warning text-text-accent-warning-contrast"
      },
      {
        variant: "solid",
        color: "success",
        class: "bg-background-accent-success text-text-accent-success-contrast"
      },
      {
        variant: "solid",
        color: "info",
        class: "bg-background-accent-info text-text-accent-info-contrast"
      },
      // Minimal
      {
        variant: "minimal",
        color: "primary",
        class:
          "bg-background-surface shadow-border-badge-border-surface text-primitive-primary-muted-contrast"
      },
      {
        variant: "minimal",
        color: "neutral",
        class:
          "bg-background-surface-glass shadow-border-badge-border-surface text-text-accent-neutral-muted-contrast"
      },
      {
        variant: "minimal",
        color: "promo",
        class:
          "bg-background-surface-glass shadow-border-badge-border-surface text-text-accent-promo-muted-contrast"
      },
      {
        variant: "minimal",
        color: "danger",
        class:
          "bg-background-surface-glass shadow-border-badge-border-surface text-text-accent-danger-muted-contrast"
      },
      {
        variant: "minimal",
        color: "warning",
        class:
          "bg-background-surface-glass shadow-border-badge-border-surface text-text-accent-warning-muted-contrast"
      },
      {
        variant: "minimal",
        color: "success",
        class:
          "bg-background-surface-glass shadow-border-badge-border-surface text-text-accent-success-muted-contrast"
      },
      {
        variant: "minimal",
        color: "info",
        class:
          "bg-background-surface-glass shadow-border-badge-border-surface text-text-accent-info-muted-contrast"
      },
      // Muted
      {
        variant: "muted",
        color: "primary",
        class:
          "primary-stroke bg-primitive-primary-muted text-text-primitive-primary-muted-contrast"
      },
      {
        variant: "muted",
        color: "neutral",
        class:
          "bg-background-accent-neutral-muted shadow-border-badge-border-accent-neutral text-text-accent-neutral-muted-contrast"
      },
      {
        variant: "muted",
        color: "promo",
        class:
          "bg-background-accent-promo-muted shadow-border-badge-border-accent-promo text-text-accent-promo-muted-contrast"
      },
      {
        variant: "muted",
        color: "danger",
        class:
          "bg-background-accent-danger-muted shadow-border-badge-border-accent-danger text-text-accent-danger-muted-contrast"
      },
      {
        variant: "muted",
        color: "warning",
        class:
          "bg-background-accent-warning-muted shadow-border-badge-border-accent-warning text-text-accent-warning-muted-contrast"
      },
      {
        variant: "muted",
        color: "success",
        class:
          "bg-background-accent-success-muted shadow-border-badge-border-accent-success text-text-accent-success-muted-contrast"
      },
      {
        variant: "muted",
        color: "info",
        class:
          "bg-background-accent-info-muted shadow-border-badge-border-accent-info text-text-accent-info-muted-contrast"
      }
    ]
  }
);

// -----------------------------------------------------------------------------
export default {
  badge: badgeVariants
};
