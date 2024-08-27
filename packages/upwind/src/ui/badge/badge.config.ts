import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const badgeConfig = cva(
  "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        flat: "border border-transparent",
        outlined: "border bg-opacity-0",
        tonal: "border border-transparent",
      },
      color: {
        base: "text-base-background bg-base-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        promotion: "bg-promotion text-promotion-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        info: "bg-info text-info-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground",
      },
    },
    compoundVariants: [
      {
        color: "base",
        variant: "outlined",
        class: "border-base-foreground text-base-foreground",
      },
      {
        color: "primary",
        variant: "outlined",
        class: "border-primary text-primary",
      },
      {
        color: "secondary",
        variant: "outlined",
        class: "border-secondary text-secondary",
      },
      {
        color: "accent",
        variant: "outlined",
        class: "border-accent text-accent",
      },
      {
        color: "promotion",
        variant: "outlined",
        class: "border-promotion text-promotion",
      },
      {
        color: "destructive",
        variant: "outlined",
        class: "border-destructive text-destructive",
      },

      {
        color: "success",
        variant: "outlined",
        class: "border-success text-success",
      },
      { color: "info", variant: "outlined", class: "border-info text-info" },
      {
        color: "error",
        variant: "outlined",
        class: "border-error text-error",
      },
      {
        color: "warning",
        variant: "outlined",
        class: "border-warning text-warning",
      },
      // ---

      {
        color: "base",
        variant: "tonal",
        class: "bg-base-200 text-base-foreground",
      },

      {
        color: "primary",
        variant: "tonal",
        class: "bg-primary-50 text-primary",
      },
      {
        color: "secondary",
        variant: "tonal",
        class: "bg-secondary-50 text-secondary",
      },
      {
        color: "accent",
        variant: "tonal",
        class: "bg-accent-50 text-accent",
      },
      {
        color: "promotion",
        variant: "tonal",
        class: "bg-promotion-50 text-promotion",
      },
      {
        color: "destructive",
        variant: "tonal",
        class: "bg-destructive-50 text-destructive",
      },
      {
        color: "success",
        variant: "tonal",
        class: "bg-success-50 text-success",
      },
      { color: "info", variant: "tonal", class: "bg-info-50 text-info" },
      { color: "error", variant: "tonal", class: "bg-error-50 text-error" },
      {
        color: "warning",
        variant: "tonal",
        class: "bg-warning-50 text-warning",
      },
    ],
    defaultVariants: {
      variant: "flat",
      color: "base",
    },
  }
);

export default {
  badge: {
    root: badgeConfig,
    label: cva("font-normal"),
  },
};
