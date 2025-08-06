import { cva } from "class-variance-authority";

export const alertVariants = cva(
  "group relative w-full rounded p-4 [&>i+div]:translate-y-[-3px] [&>i]:absolute [&>i]:left-4 [&>i]:top-4 [&>i~*]:pl-7",
  {
    // Alert props doesn't see that the variants exist without these
    variants: {
      variant: {
        outline: "border",
        solid: ""
      },
      color: {
        base: "",
        primary: "",
        secondary: "",
        accent: "",
        promotion: "",
        destructive: "",
        success: "",
        info: "",
        error: "",
        warning: ""
      }
    },
    compoundVariants: [
      {
        variant: "solid",
        color: "base",
        class: "bg-base-muted text-base-muted-foreground"
      },
      {
        variant: "solid",
        color: "primary",
        class: "bg-primary-muted text-primary-muted-foreground"
      },
      {
        variant: "solid",
        color: "secondary",
        class: "bg-secondary-muted text-secondary-muted-foreground"
      },
      {
        variant: "solid",
        color: "accent",
        class: "bg-accent-muted text-accent-muted-foreground"
      },
      {
        variant: "solid",
        color: "promotion",
        class: "bg-promotion-muted text-promotion-muted-foreground"
      },
      {
        variant: "solid",
        color: "destructive",
        class: "bg-destructive-muted text-destructive-muted-foreground"
      },
      {
        variant: "solid",
        color: "success",
        class: "bg-success-muted text-success-muted-foreground"
      },
      {
        variant: "solid",
        color: "warning",
        class: "bg-warning-muted text-warning-muted-foreground"
      },
      {
        variant: "solid",
        color: "info",
        class: "bg-info-muted text-info-muted-foreground"
      },
      {
        variant: "solid",
        color: "error",
        class: "bg-error-muted text-error-muted-foreground"
      },
      {
        variant: "outline",
        color: "base",
        class: "border bg-base-background text-base-foreground"
      },
      {
        variant: "outline",
        color: "primary",
        class: "bg-primary-muted text-primary-muted-foreground border-primary"
      },
      {
        variant: "outline",
        color: "secondary",
        class:
          "bg-secondary-muted text-secondary-muted-foreground border-secondary"
      },
      {
        variant: "outline",
        color: "accent",
        class: "test bg-accent-muted text-accent-muted-foreground border-accent"
      },
      {
        variant: "outline",
        color: "promotion",
        class:
          "bg-promotion-muted text-promotion-muted-foreground border-promotion"
      },
      {
        variant: "outline",
        color: "destructive",
        class:
          "bg-destructive-muted text-destructive-muted-foreground border-destructive"
      },
      {
        variant: "outline",
        color: "success",
        class: "bg-success-muted text-success-muted-foreground border-success"
      },
      {
        variant: "outline",
        color: "info",
        class: "bg-info-muted text-info-muted-foreground border-info"
      },
      {
        variant: "outline",
        color: "error",
        class: "bg-error-muted border-error text-error"
      },
      {
        variant: "outline",
        color: "warning",
        class: "bg-warning-muted text-warning-muted-foreground border-warning"
      }
    ],
    defaultVariants: {
      variant: "outline",
      color: "base"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  alert: alertVariants
};
