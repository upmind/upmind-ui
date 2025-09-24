import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

const variants = {
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

export { variants };

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
          "from-primitive-primary-default to-primitive-primary-default-stop text-text-primary-default-contrast bg-gradient-to-r"
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
          "bg-background-surface border-border-surface text-primitive-primary-muted-contrast stroke-badge"
      },
      {
        variant: "minimal",
        color: "neutral",
        class:
          "bg-background-surface-glass border-border-surface text-text-accent-neutral-muted-contrast stroke-badge"
      },
      {
        variant: "minimal",
        color: "promo",
        class:
          "bg-background-surface-glass border-border-surface text-text-accent-promo-muted-contrast stroke-badge"
      },
      {
        variant: "minimal",
        color: "danger",
        class:
          "bg-background-surface-glass border-border-surface text-text-accent-danger-muted-contrast stroke-badge"
      },
      {
        variant: "minimal",
        color: "warning",
        class:
          "bg-background-surface-glass border-border-surface text-text-accent-warning-muted-contrast stroke-badge"
      },
      {
        variant: "minimal",
        color: "success",
        class:
          "bg-background-surface-glass border-border-surface text-text-accent-success-muted-contrast stroke-badge"
      },
      {
        variant: "minimal",
        color: "info",
        class:
          "bg-background-surface-glass border-border-surface text-text-accent-info-muted-contrast stroke-badge"
      },
      // Muted
      {
        variant: "muted",
        color: "primary",
        class:
          "primary-stroke bg-primitive-primary-muted text-text-primitive-primary-muted-contrast stroke-badge"
      },
      {
        variant: "muted",
        color: "neutral",
        class:
          "bg-background-accent-neutral-muted border-border-accent-neutral text-text-accent-neutral-muted-contrast stroke-badge"
      },
      {
        variant: "muted",
        color: "promo",
        class:
          "bg-background-accent-promo-muted border-border-accent-promo text-text-accent-promo-muted-contrast stroke-badge"
      },
      {
        variant: "muted",
        color: "danger",
        class:
          "bg-background-accent-danger-muted border-border-accent-danger text-text-accent-danger-muted-contrast stroke-badge"
      },
      {
        variant: "muted",
        color: "warning",
        class:
          "bg-background-accent-warning-muted border-border-accent-warning text-text-accent-warning-muted-contrast stroke-badge"
      },
      {
        variant: "muted",
        color: "success",
        class:
          "bg-background-accent-success-muted border-border-accent-success text-text-accent-success-muted-contrast stroke-badge"
      },
      {
        variant: "muted",
        color: "info",
        class:
          "bg-background-accent-info-muted border-border-accent-info text-text-accent-info-muted-contrast stroke-badge"
      }
    ]
  }
);

// -----------------------------------------------------------------------------
export default {
  badge: badgeVariants
};
