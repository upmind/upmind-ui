import { cva } from "class-variance-authority";

export const alertVariants = cva(
  "group relative w-full rounded-lg border p-4 [&>i+div]:translate-y-[-3px] [&>i]:absolute [&>i]:left-4 [&>i]:top-4 [&>i~*]:pl-7",
  {
    // Alert props doesn't see that the variants exist without these
    variants: {
      variant: {
        outline: "",
        solid: "",
        tonal: "border-none",
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
        warning: "",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        color: "base",
        class: "border bg-base-background text-base-foreground",
      },
      {
        variant: "outline",
        color: "primary",
        class: "bg-primary-muted text-primary-muted-foreground border-primary",
      },
      {
        variant: "outline",
        color: "secondary",
        class:
          "bg-secondary-muted text-secondary-muted-foreground border-secondary",
      },
      {
        variant: "outline",
        color: "accent",
        class:
          "test bg-accent-muted text-accent-muted-foreground border-accent",
      },
      {
        variant: "outline",
        color: "promotion",
        class:
          "bg-promotion-muted text-promotion-muted-foreground border-promotion",
      },
      {
        variant: "outline",
        color: "destructive",
        class:
          "bg-destructive-muted text-destructive-muted-foreground border-destructive",
      },
      {
        variant: "outline",
        color: "success",
        class: "bg-success-muted text-success-muted-foreground border-success",
      },
      {
        variant: "outline",
        color: "info",
        class: "bg-info-muted text-info-muted-foreground border-info",
      },
      {
        variant: "outline",
        color: "error",
        class: "bg-error-muted border-error text-error",
      },
      {
        variant: "outline",
        color: "warning",
        class: "bg-warning-muted text-warning-muted-foreground border-warning",
      },
      {
        variant: "solid",
        color: "base",
        class: "border-base-800 bg-base-800 text-base",
      },
      {
        variant: "solid",
        color: "primary",
        class: "text-primary-muted-muted-foreground border-primary bg-primary",
      },
      {
        variant: "solid",
        color: "secondary",
        class:
          "text-secondary-muted-muted-foreground border-secondary bg-secondary",
      },
      {
        variant: "solid",
        color: "accent",
        class: "text-accent-muted-muted-foreground border-accent bg-accent",
      },
      {
        variant: "solid",
        color: "promotion",
        class:
          "text-promotion-muted-muted-foreground border-promotion bg-promotion",
      },
      {
        variant: "solid",
        color: "destructive",
        class:
          "text-destructive-muted-muted-foreground border-destructive bg-destructive",
      },
      {
        variant: "solid",
        color: "success",
        class: "text-success-muted-muted-foreground border-success bg-success",
      },
      {
        variant: "solid",
        color: "info",
        class: "text-info-muted-muted-foreground border-info bg-info",
      },
      {
        variant: "solid",
        color: "error",
        class: "border-error bg-error text-error",
      },
      {
        variant: "solid",
        color: "warning",
        class: "text-warning-muted-muted-foreground border-warning bg-warning",
      },
      {
        variant: "tonal",
        color: "base",
        class: "bg-base text-base-foreground",
      },
      {
        variant: "tonal",
        color: "primary",
        class: "bg-primary-muted text-primary-muted-foreground",
      },
      {
        variant: "tonal",
        color: "secondary",
        class: "bg-secondary-muted text-secondary-muted-foreground",
      },
      {
        variant: "tonal",
        color: "accent",
        class: "bg-accent-muted text-accent-muted-foreground",
      },
      {
        variant: "tonal",
        color: "promotion",
        class: "bg-promotion-muted text-promotion-muted-foreground",
      },
      {
        variant: "tonal",
        color: "destructive",
        class: "bg-destructive-muted text-destructive-muted-foreground",
      },
      {
        variant: "tonal",
        color: "success",
        class: "bg-success-muted text-success-muted-foreground",
      },
      {
        variant: "tonal",
        color: "warning",
        class: "bg-warning-muted text-warning-muted-foreground",
      },
      {
        variant: "tonal",
        color: "info",
        class: "bg-info-muted text-info-muted-foreground",
      },
      {
        variant: "tonal",
        color: "error",
        class: "bg-error-muted text-error-muted-foreground",
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "base",
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  alert: alertVariants,
};
