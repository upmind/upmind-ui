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
          "from-primitive-primary-default to-primitive-primary-default-stop text-accent-primary-contrast bg-gradient-to-r"
      },
      {
        variant: "solid",
        color: "neutral",
        class: "bg-accent-neutral text-accent-neutral-contrast"
      },
      {
        variant: "solid",
        color: "promo",
        class: "bg-accent-promo text-accent-promo-contrast"
      },
      {
        variant: "solid",
        color: "danger",
        class: "bg-accent-danger text-accent-danger-contrast"
      },
      {
        variant: "solid",
        color: "warning",
        class: "bg-accent-warning text-accent-warning-contrast"
      },
      {
        variant: "solid",
        color: "success",
        class: "bg-accent-success text-accent-success-contrast"
      },
      {
        variant: "solid",
        color: "info",
        class: "bg-accent-info text-accent-info-contrast"
      },
      // Minimal
      {
        variant: "minimal",
        color: "primary",
        class:
          "bg-surface shadow-border-badge-border-surface text-primitive-primary-muted-contrast"
      },
      {
        variant: "minimal",
        color: "neutral",
        class:
          "bg-surface-glass shadow-border-badge-border-surface text-accent-neutral-muted-contrast"
      },
      {
        variant: "minimal",
        color: "promo",
        class:
          "bg-surface-glass shadow-border-badge-border-surface text-accent-promo-muted-contrast"
      },
      {
        variant: "minimal",
        color: "danger",
        class:
          "bg-surface-glass shadow-border-badge-border-surface text-accent-danger-muted-contrast"
      },
      {
        variant: "minimal",
        color: "warning",
        class:
          "bg-surface-glass shadow-border-badge-border-surface text-accent-warning-muted-contrast"
      },
      {
        variant: "minimal",
        color: "success",
        class:
          "bg-surface-glass shadow-border-badge-border-surface text-accent-success-muted-contrast"
      },
      {
        variant: "minimal",
        color: "info",
        class:
          "bg-surface-glass shadow-border-badge-border-surface text-accent-info-muted-contrast"
      },
      // Muted
      {
        variant: "muted",
        color: "primary",
        class:
          "primary-stroke bg-primitive-primary-muted text-primitive-primary-muted-contrast"
      },
      {
        variant: "muted",
        color: "neutral",
        class:
          "bg-accent-neutral-muted shadow-border-badge-border-accent-neutral text-accent-neutral-muted-contrast"
      },
      {
        variant: "muted",
        color: "promo",
        class:
          "bg-accent-promo-muted shadow-border-badge-border-accent-promo text-accent-promo-muted-contrast"
      },
      {
        variant: "muted",
        color: "danger",
        class:
          "bg-accent-danger-muted shadow-border-badge-border-accent-danger text-accent-danger-muted-contrast"
      },
      {
        variant: "muted",
        color: "warning",
        class:
          "bg-accent-warning-muted shadow-border-badge-border-accent-warning text-accent-warning-muted-contrast"
      },
      {
        variant: "muted",
        color: "success",
        class:
          "bg-accent-success-muted shadow-border-badge-border-accent-success text-accent-success-muted-contrast"
      },
      {
        variant: "muted",
        color: "info",
        class:
          "bg-accent-info-muted shadow-border-badge-border-accent-info text-accent-info-muted-contrast"
      }
    ]
  }
);

// -----------------------------------------------------------------------------
export default {
  badge: badgeVariants
};
