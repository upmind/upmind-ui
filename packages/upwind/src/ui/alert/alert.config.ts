import { cva } from "class-variance-authority";

export const alertConfig = cva(
  "group relative w-full rounded-lg border p-4 has-[i]:pl-10 has-[svg]:pl-10",
  {
    // Alert props doesn't see that the variants exist without these
    variants: {
      variant: {
        outline: "",
        solid: "",
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
        class: "text-base-foreground bg-base-background border",
      },
      {
        variant: "outline",
        color: "primary",
        class: "bg-primary-50 border-primary text-primary",
      },
      {
        variant: "outline",
        color: "secondary",
        class: "bg-secondary-50 border-secondary text-secondary",
      },
      {
        variant: "outline",
        color: "accent",
        class: "bg-accent-50 test border-accent text-accent",
      },
      {
        variant: "outline",
        color: "promotion",
        class: "text-promotion bg-promotion-50 border-promotion",
      },
      {
        variant: "outline",
        color: "destructive",
        class: "bg-destructive-50 border-destructive text-destructive",
      },
      {
        variant: "outline",
        color: "success",
        class: "text-success bg-success-50 border-success",
      },
      {
        variant: "outline",
        color: "info",
        class: "text-info bg-info-50 border-info",
      },
      {
        variant: "outline",
        color: "error",
        class: "text-error bg-error-50 border-error",
      },
      {
        variant: "outline",
        color: "warning",
        class: "text-warning bg-warning-50 border-warning",
      },
      {
        variant: "solid",
        color: "base",
        class: "bg-base-800 border-base-800 text-base",
      },
      {
        variant: "solid",
        color: "primary",
        class: "text-primary-50 border-primary bg-primary",
      },
      {
        variant: "solid",
        color: "secondary",
        class: "text-secondary-50 border-secondary bg-secondary",
      },
      {
        variant: "solid",
        color: "accent",
        class: "text-accent-50 border-accent bg-accent",
      },
      {
        variant: "solid",
        color: "promotion",
        class: "text-promotion-50 bg-promotion border-promotion",
      },
      {
        variant: "solid",
        color: "destructive",
        class: "text-destructive-50 border-destructive bg-destructive",
      },
      {
        variant: "solid",
        color: "success",
        class: "text-success-50 bg-success border-success",
      },
      {
        variant: "solid",
        color: "info",
        class: "text-info-50 bg-info border-info",
      },
      {
        variant: "solid",
        color: "error",
        class: "text-error-50 bg-error border-error",
      },
      {
        variant: "solid",
        color: "warning",
        class: "text-warning-50 bg-warning border-warning",
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "base",
    },
  }
);

export default {
  alert: {
    root: alertConfig,
    title: cva("mb-1 font-medium leading-none tracking-tight"),
    description: cva("text-sm opacity-75 [&_p]:leading-relaxed"),
    icon: cva("absolute left-4 top-4 size-[1em]"),
  },
};
