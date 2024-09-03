import { cva } from "class-variance-authority";

export const alertConfig = cva(
  "group relative w-full rounded-lg border p-4 [&>i+div]:translate-y-[-3px] [&>i]:absolute [&>i]:left-4 [&>i]:top-4 [&>i~*]:pl-7",
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
        class: "border bg-base-background text-base-foreground",
      },
      {
        variant: "outline",
        color: "primary",
        class: "border-primary bg-primary-50 text-primary",
      },
      {
        variant: "outline",
        color: "secondary",
        class: "border-secondary bg-secondary-50 text-secondary",
      },
      {
        variant: "outline",
        color: "accent",
        class: "test border-accent bg-accent-50 text-accent",
      },
      {
        variant: "outline",
        color: "promotion",
        class: "border-promotion bg-promotion-50 text-promotion",
      },
      {
        variant: "outline",
        color: "destructive",
        class: "border-destructive bg-destructive-50 text-destructive",
      },
      {
        variant: "outline",
        color: "success",
        class: "border-success bg-success-50 text-success",
      },
      {
        variant: "outline",
        color: "info",
        class: "border-info bg-info-50 text-info",
      },
      {
        variant: "outline",
        color: "error",
        class: "border-error bg-error-50 text-error",
      },
      {
        variant: "outline",
        color: "warning",
        class: "border-warning bg-warning-50 text-warning",
      },
      {
        variant: "solid",
        color: "base",
        class: "border-base-800 bg-base-800 text-base",
      },
      {
        variant: "solid",
        color: "primary",
        class: "border-primary bg-primary text-primary-50",
      },
      {
        variant: "solid",
        color: "secondary",
        class: "border-secondary bg-secondary text-secondary-50",
      },
      {
        variant: "solid",
        color: "accent",
        class: "border-accent bg-accent text-accent-50",
      },
      {
        variant: "solid",
        color: "promotion",
        class: "border-promotion bg-promotion text-promotion-50",
      },
      {
        variant: "solid",
        color: "destructive",
        class: "border-destructive bg-destructive text-destructive-50",
      },
      {
        variant: "solid",
        color: "success",
        class: "border-success bg-success text-success-50",
      },
      {
        variant: "solid",
        color: "info",
        class: "border-info bg-info text-info-50",
      },
      {
        variant: "solid",
        color: "error",
        class: "border-error bg-error text-error-50",
      },
      {
        variant: "solid",
        color: "warning",
        class: "border-warning bg-warning text-warning-50",
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
