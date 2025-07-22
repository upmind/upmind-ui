import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const badgeVariants = cva(
  "focus:ring-ring inline-flex w-fit items-center whitespace-nowrap rounded-pill border font-semibold leading-tight transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        flat: "border border-transparent",
        outline: "border !bg-opacity-0",
        tonal: "border border-transparent"
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "!px-3 !py-2 !text-lg"
      },
      color: {
        base: "bg-base-foreground text-base-background",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        promotion: "bg-promotion text-promotion-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        info: "bg-info text-info-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground",
        disabled: "bg-gray-50 text-gray-400"
      }
    },
    compoundVariants: [
      {
        color: "base",
        variant: "outline",
        class: "border-base-foreground text-base-foreground"
      },
      {
        color: "primary",
        variant: "outline",
        class: "border-primary text-primary"
      },
      {
        color: "secondary",
        variant: "outline",
        class: "border-secondary text-secondary"
      },
      {
        color: "accent",
        variant: "outline",
        class: "border-accent text-accent"
      },
      {
        color: "promotion",
        variant: "outline",
        class: "border-promotion text-promotion"
      },
      {
        color: "destructive",
        variant: "outline",
        class: "border-destructive text-destructive"
      },
      {
        color: "success",
        variant: "outline",
        class: "border-success text-success"
      },
      { color: "info", variant: "outline", class: "border-info text-info" },
      {
        color: "error",
        variant: "outline",
        class: "border-error text-error"
      },
      {
        color: "warning",
        variant: "outline",
        class: "border-warning text-warning"
      },
      // ---

      {
        color: "base",
        variant: "tonal",
        class: "bg-base-muted text-base-muted-foreground"
      },

      {
        color: "primary",
        variant: "tonal",
        class: "bg-primary-muted text-primary-muted-foreground"
      },
      {
        color: "secondary",
        variant: "tonal",
        class: "bg-secondary-muted text-secondary-muted-foreground"
      },
      {
        color: "accent",
        variant: "tonal",
        class: "bg-accent-muted text-accent-muted-foreground"
      },
      {
        color: "promotion",
        variant: "tonal",
        class: "bg-promotion-muted text-promotion-muted-foreground"
      },
      {
        color: "destructive",
        variant: "tonal",
        class: "bg-destructive-muted text-destructive-muted-foreground"
      },
      {
        color: "success",
        variant: "tonal",
        class: "bg-success-muted text-success-muted-foreground"
      },
      {
        color: "info",
        variant: "tonal",
        class: "bg-info-muted text-info-muted-foreground"
      },
      { color: "error", variant: "tonal", class: "bg-error-muted text-error" },
      {
        color: "warning",
        variant: "tonal",
        class: "bg-warning-muted text-warning-muted-foreground"
      }
    ],
    defaultVariants: {
      variant: "flat",
      color: "base"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  badge: badgeVariants
};
